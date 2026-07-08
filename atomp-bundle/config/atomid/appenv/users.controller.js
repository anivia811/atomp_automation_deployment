/**
	* Copyright (C) 2019 Global Smart Technologies - All Rights Reserved
	*
	*/

/**
	* Users Controller
	*/
const speakeasy = require("speakeasy")
const service = require('./users.service')
const status = require('./users.response-status')
const validation = require('./users.validation')
const crypto = require('crypto-js')
const tokenHandler = require('../../utilities/token-handler')
const company_service = require('../companies/companies.service')
const constant = require('../../utilities/constant')
const { sendMail } = require('../../utilities/mail/mail')
const en = require('../../utilities/mail/language/en.json')
const ja = require('../../utilities/mail/language/ja.json')
const path = require('path')
const dbUltil = require('../../utilities/db-util')
const file = require('../../utilities/file')
const _ = require('lodash')
const QRCode = require('qrcode');
const totp = require("speakeasy").totp
const dateUltil = require('../../utilities/date');
const { TextEncoder } = require("util"); // Manually import TextEncoder
global.TextEncoder = TextEncoder; // Set it globally

const AVATAR = {
	ALLOWED_FILE_TYPES: ['jpeg', 'jpg', 'png'],
	MAX_FILE_SIZE: 5 * 1024 * 1024,
	UPLOADED_FILE_KEY: 'avatar'
};
const AuthMappingCompany = require('../../utilities/auth-const');
const authenConst = require('../core/db-const/auth-events.const');

const jwtPrivateKeyClientPath = appman.config.environments.server.openssl.privateKeyClientPath
const accessTokenLife = appman.config.environments.server.token.accessTokenLife

// Sync role to device farm
const SYNC_USER_ROLE_DF = {
	5: 'guest',
	2: 'user',
	4: 'partner',
	1: 'admin'
};

/**
* @url {host}/api/atomid/register
* @method POST
* @queryParams N/A
* @pathParams N/A
* @body email, password, nationality
*/
const register = async (req, res) => {
	try {
		const body = req.body
		const { error, value } = validation.register.validate(body)
		if (error) {
			return appman.response.apiSuccess(res, {}, error.message)
		}
		const company = await dbUltil.getCompanyEnterpriseByDomain(body.email.split('@')[1])
		if (company.length > 0) {
			return appman.response.apiSuccess(res, {}, status.ATF064)
		}
		let userData = await service.findUser(value, true)
		if (userData) {
			return appman.response.apiSuccess(res, {}, status.ATF013)
		}
		const salt = await service.createSalt()
		const hash_password = await service.hashPassword(body.password, salt)
		const secret_key = await service.createSecretKey()
		const otpCode = await service.createVerifyCode(secret_key)
		const otp_issued_in = Date.now()
		let user = await service.createUser({
			lang: req.headers.lang.toLowerCase(),
			body: value,
			secret_key: secret_key,
			salt: salt,
			otp_issued_in: otp_issued_in
		})
		await service.saveNewPassword({
			user_id: user.id,
			hash_password: hash_password
		})
		if (user) {
			user.isActiveUser = true
			const { jti, accessToken } = await tokenHandler.generateToken({ user: user, tokenLife: accessTokenLife, isFromCLient: true, jwtPrivateKeyClientPath: jwtPrivateKeyClientPath })
			const sender = appman.config.environments.server.mail.sender
			const template = path.resolve(__dirname, '..', '..', 'utilities/mail/templates/register')
			const options = {
				data: {
					email: value.email,
					otp: otpCode
				},
				emailText: { en, ja }['en']['register'],
				template: template
			}
			sendMail(sender, options)
			const listCompany = await company_service.getListCompany(user.id)
			//Save access token to redis server
			await tokenHandler.saveAccessTokenToRedisServer(jti, accessToken)
			return appman.response.apiSuccess(res, {
				accessToken: accessToken,
				user_name: user.full_name,
				user_email: user.email,
				avatar_url: user.avatar_url,
				companies: listCompany
			}, status.ATS029)
		}
	} catch (error) {
		return appman.response.systemError(res, error)
	}
}

/**
* @url {host}/api/getListNationality
* @method GET
* @queryParams N/A
* @pathParams N/A
* @body N/A
*/
const getListNationality = async (req, res) => {
	try {
		const nationality = await service.getListNationality()
		if (nationality) {
			return appman.response.apiSuccess(res, nationality, status.ATS029)
		} else {
			return appman.response.apiSuccess(res)
		}
	} catch (error) {
		return appman.response.systemError(res, error)
	}
}

/**
* @url {host}/api/auth/token
* @method POST
* @queryParams N/A
* @pathParams N/A
* @body email, password
*/
const login = async (req, res) => {
	// Get client's address
	const ip = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() || req.socket.remoteAddress;

	// Get request data
	const body = req.body;
	try {
		// Login retry time
		const loginRetryTime = dateUltil.toSeconds(appman.config.environments.server.login_retry_time_in_hour); // Parse from hour to second

		// Login delay retry time
		const loginDelayRetryTime = dateUltil.toSeconds(0, appman.config.environments.server.login_delay_retry_time_in_minute); // Parse from minute to second

		// Login retry attempts
		const loginRetryAttempts = appman.config.environments.server.login_retry_attempts;

		let user = {}
		//Validate params
		const { email, password } = await validation.login.validate(body).value;
		//Get company enterprise 
		const company = await dbUltil.getCompanyEnterpriseByDomain(email.split('@')[1])
		//Set expried_at
		const expired_at = Date.now() + appman.config.environments.server.token.refreshTokenLifeMilliseconds
		//Check that the company is an enterprise company and that the company has its own authentication section
		if (company.length > 0 && company[0].code &&
			AuthMappingCompany[company[0].code.toLowerCase()] !== undefined) {//Auth for user enterprise company
			try {
				var auth_service = require(AuthMappingCompany[company[0].code.toLowerCase()].service)
			} catch (error) {
				console.error(`[${body.service}] ${error.message} for company [${company[0].name}] (id: [${company[0].id}])`)
				throw error;
			}
			const responseData = await auth_service.login({
				email: email,
				password: password
			})

			// mock authen
			// var responseData = {
			// 	userData: {
			// 		displayName: 'test',
			// 		username: 'test'
			// 	}
			// }
			// mock authen 

			if (responseData.userData) {
				//create user if not exist
				user = await service.createUserIfNotExist({
					email: email,
					displayName: responseData.userData.displayName
				})
				//Add user to company if not exist company'user
				await service.addUserCompanyIfNotExist({
					user: user,
					company: company[0]
				})
				//Set name user with origin name enterprise
				user.name = responseData.userData.username

				console.warn(`[${body.service}][${ip}]Logged in successfully with enterprise authentication for [${email}]`);
			} else {
				// Push failure login events
				await service.hanleLoggedFailureAuthen(body, constant.AUTHENTICATION_LOGIN_REASON.FAILURE_ENTERPRISE, ip);

				console.warn(`[${body.service}][${ip}]Login failed with enterprise authentication for [${email}]`)
				return appman.response.apiSuccess(res, {}, responseData.resStatus.status);
			}
		} else {//Auth for user normal
			// Check user info is exist or not
			const userData = await service.findUser(body);

			// Stop process if email doest not exist or inactive
			if (!userData || userData.status !== constant.user.status.active) {
				// Push failure login events
				if (userData) {
					await service.hanleLoggedFailureAuthen(body, constant.AUTHENTICATION_LOGIN_REASON.NOT_EXIST_INACTIVE_NON_ENTERPRISE, ip, userData.id);
				}

				console.warn(`[${body.service}][${ip}]Login failed with ATOMP authentication because [${email}] does not exist or inactive`)
				return appman.response.apiSuccess(res, {}, status.ATF067);
			}

			// Checking expired users or not
			const isExpireUser = await service.handleExpiredUsers(userData, constant.user.status.inactive);

			// Stop process if email is expired
			if (isExpireUser) {
				// Push failure login events
				await service.hanleLoggedFailureAuthen(body, constant.AUTHENTICATION_LOGIN_REASON.EXPIRED_EMAIL_NON_ENTERPRISE, ip, userData.id);

				console.warn(`[${body.service}][${ip}]Login failed with ATOMP authentication because [${email}] is expired`)
				return appman.response.apiSuccess(res, {}, status.ATF067);
			}

			// Delete failed login attempts older than retry time
			await service.deleteUserFailedLoginRecordAfterTime(userData.id, loginRetryTime);

			/** Check if the account has logged falure exceeding the allowed number of times */
			const failureLoginAttempt = await service.countFailedUserLogin(userData.id);

			// If the last entry exceeds the delay limit, reset the failed login counter
			if (failureLoginAttempt < loginRetryAttempts) {
				await service.deleteUserFailedLoginRecordAfterTime(userData.id, loginDelayRetryTime);
			}

			// Stop process if if failed login attempts equals limit login attempts
			if (failureLoginAttempt >= loginRetryAttempts) {
				// Get last failure login
				const lastFailureLogin = await service.getLastFailureLogin(userData.id);

				// Compute the wait remain time
				const remainingTime = Math.round((Date.parse(lastFailureLogin.createdAt) + dateUltil.toMilliseconds(0, 0, loginRetryTime) - Date.now()) / 1000);

				// Set message response
				const remainingStatusResponse = appman.response.updateStatus(status.ATF068, { paramsOfMessage: [remainingTime > 0 ? remainingTime : 0] });

				// Push failure login events
				await service.hanleLoggedFailureAuthen(body, constant.AUTHENTICATION_LOGIN_REASON.LOCKED_NON_ENTERPRISE, ip, userData.id);

				console.warn(`[${body.service}][${ip}]Login failed with ATOMP authentication because [${email}] has been locked`)
				return appman.response.apiSuccess(res, {}, remainingStatusResponse);
			}

			//login with nonenterprise company
			user = await service.login(body, userData);
		}
		// Check user isActive
		if (!user || user.failurePassword || user.status === constant.user.status.inactive) {
			/** Login with nonenterprise company */

			// Login with nonenterprise company 
			if (user) {
				// Push failure login events
				await service.hanleLoggedFailureAuthen(body, constant.AUTHENTICATION_LOGIN_REASON.INCORRECT_USERINFO_NON_ENTERPRISE, ip, user.id);

				// Collect failure login attempt
				if (user.failurePassword) {
					await service.createFailureLoginAttempt(user.id, email);
				}
			}


			console.warn(`[${body.service}][${ip}]Login failed with ATOMP authentication because [${email}] or password are incorrect`)
			return appman.response.apiSuccess(res, {}, status.ATF032)
		}

		// Check password is expired
		if (appman.config.environments.server.user_password_age &&
			user.passwordExpiredAt && user.passwordExpiredAt < Date.now()) {
			// Login with nonenterprise company 
			if (user) {
				// Collect failure login attempt
				if (user.isNonEnterprise) {
					await service.createFailureLoginAttempt(user.id, email);
				}

				// Push failure login events
				await service.hanleLoggedFailureAuthen(body, constant.AUTHENTICATION_LOGIN_REASON.EXPIRED_PASSWORD_NON_ENTERPRISE, ip, user.id);
			}

			console.warn(`[${body.service}][${ip}]Login failed with ATOMP authentication because [${email}] password is expired`)
			return appman.response.apiSuccess(res, {}, status.ATF066)
		}

		// Verify OTP if user enable MFA
		if (user.mfa) {
			const isValid = totp.verify({
				secret: user.secret_key,
				token: body.otp,
				window: 2
			})

			if (!isValid) {
				// Login with nonenterprise company 
				if (user) {
					// Collect failure login attempt
					if (user.isNonEnterprise) {
						await service.createFailureLoginAttempt(user.id, email);
					}

					// Push failure login events
					await service.hanleLoggedFailureAuthen(body, constant.AUTHENTICATION_LOGIN_REASON.INCORRECT_OTP_NON_ENTERPRISE, ip, user.id);
				}

				console.warn(`[${body.service}][${ip}]Login failed with ATOMP authentication because [${email}] OTP is incorrect`)
				return appman.response.apiSuccess(res, {}, status.ATF065)
			}
		}

		// Update user language
		// if (user.lang !== req.headers.lang.toLowerCase()) {
		// 	service.updateUserLanguage(user.id, req.headers.lang.toLowerCase());
		// }

		// Store auth history
		dbUltil.createAuthHistory({
			userId: user.id,
			requestUrl: body.url,
			ip: ip,
			userAgent: req.get('User-Agent')
		})

		//Create access token
		const { jti, accessToken } = await tokenHandler.generateToken({ user: user, tokenLife: accessTokenLife, isFromCLient: true, jwtPrivateKeyClientPath: jwtPrivateKeyClientPath })
		//Create refresh token
		const refreshToken = await tokenHandler.generateRefreshToken()
		//Save Refresh token
		await tokenHandler.saveRefreshToken({
			refreshToken: refreshToken.refreshToken,
			user_id: user.id,
			expired_at
		})
		//Get list company of user
		const listCompany = await company_service.getListCompany(user.id)
		//Data response after login success
		const data = {
			accessToken: accessToken,
			refreshToken: refreshToken.token,
			user_name: user.full_name,
			user_email: user.email,
			avatar_url: '',
			companies: listCompany
		}
		// Get role by user and role group
		const rolesRs = await service.getRolesByUserId(user.id);
		const myRoleGroups = appman.acl.buildSimpleRoleListFromRecordSet(rolesRs);
		// Save ACL of user to Cache system
		// Modify key save temp data acl to redis of user at 09/04/2020 (cant use jti to identity key)
		await appman.acl.saveRoleOfUserToCache(user.email, myRoleGroups);
		//Save access token to redis server
		await tokenHandler.saveAccessTokenToRedisServer(jti, accessToken)

		// Reset failure login
		await service.deleteFailureLoginAttempt(user.id);

		// Push success login events
		await service.createAuthenticationEvents({
			user_id: user.id,
			type: authenConst.TYPE.LOGIN,
			status: authenConst.STATUS.SUCCESS,
			service: body.service,
			address: (ip || '').replace(/^.*:/, '')
		});

    console.warn(`[${body.service}][${ip}]Logged in successfully with ATOMP authentication for [${email}]`);

    const cookieOption = _.clone(appman.config.environments.server.cookieOption);
    if (cookieOption && Object.keys(cookieOption).length > 0) {
      const expHours = accessTokenLife.replace('h', '');
      const expireTime = expHours * 3600 * 1000;

      // Re-assign maxage
      cookieOption.maxAge = expireTime;

      res.cookie('token', accessToken, cookieOption);
      res.cookie('email', user.email, cookieOption);
    } else {
      res.cookie('token', accessToken);
      res.cookie('email', user.email, cookieOption);
    }

		return appman.response.apiSuccess(res, data, status.ATS029);
	} catch (error) {
		// Push failure login events
		await service.hanleLoggedFailureAuthen(body, constant.AUTHENTICATION_LOGIN_REASON.INTERNAL_SERVER_ERROR_NON_ENTERPRISE, ip);

		console.error(`[${body.service}][${ip}]Login failed with ATOMP authentication because internal server error`)
		return appman.response.systemError(res, error)
	}
}

/**
* @url {host}/api/auth/token/verify
* @method POST
* @queryParams N/A
* @pathParams N/A
* @body N/A
*/
const verifyToken = async (req, res) => {
	try {
		return appman.response.apiSuccess(res, { payload: req.jwtDecoded.data }, status.ATS029)
	} catch (error) {
		return appman.response.systemError(res, error)
	}
}

/**
* @url {host}/api/atomid/verifyEmail
* @method POST
* @queryParams N/A
* @pathParams N/A
* @body otp
*/
const verifyEmail = async (req, res) => {
	try {
		const body = req.body
		const decoded = req.jwtDecodedTemp
		const email = decoded.data.email
		const step = appman.config.environments.server.otp_step
		const user = await service.findUser({ email: email }, false)
		const result = await service.verifyOTP(body.otp, step, user.secret_key)
		if (result) {
			const { accessToken } = await tokenHandler.generateToken({ user: user, tokenLife: accessTokenLife, isFromCLient: true, jwtPrivateKeyClientPath: jwtPrivateKeyClientPath })
			const refreshToken = await tokenHandler.generateRefreshToken()
			const expired_at = Date.now() + appman.config.environments.server.token.refreshTokenLifeMilliseconds
			await tokenHandler.saveRefreshToken({
				refreshToken: refreshToken.refreshToken,
				user_id: user.id,
				expired_at
			})

			// Find user's role
			const rolesRs = await service.getRolesByUserId(user.id);

			const myRoleGroups = appman.acl.buildSimpleRoleListFromRecordSet(rolesRs);

			// Save ACL of user to Cache system
			// Modify key save temp data acl to redis of user at 09/04/2020 (cant use jti to identity key)
			await appman.acl.saveRoleOfUserToCache(user.email, myRoleGroups);

			await service.updateUserStatus(email, constant.user.status.active)
			return appman.response.apiSuccess(res, {
				accessToken: accessToken,
				refreshToken: refreshToken.token,
				user_name: user.full_name,
				user_email: user.email,
				avatar_url: user.avatar_url
			}, status.ATS013)
		} else {
			return appman.response.apiSuccess(res, {}, status.ATF014)
		}
	} catch (error) {
		return appman.response.systemError(res, error)
	}
}

/**
* @url {host}/api/atomid/otp/generate
* @method POST
* @queryParams N/A
* @pathParams N/A
* @body N/A
*/
const generateOTP = async (req, res) => {
	try {
		const decoded = req.jwtDecodedTemp
		const email = decoded.data.email
		const result = await service.generateOtpCode(email)

		if (result) {
			return appman.response.apiSuccess(res, {}, status.ATS015)
		} else {
			return appman.response.apiSuccess(res, {}, status.ATF016)
		}
	} catch (error) {
		return appman.response.systemError(res, error)
	}
}

/**
* @url {host}/api/atomid/otp/remainTime
* @method GET
* @queryParams N/A
* @pathParams N/A
* @body N/A
*/
const getRemainingTime = async (req, res) => {
	try {
		const decoded = req.jwtDecodedTemp
		const email = decoded.data.email
		const remainTime = await service.getRemainTime(email)
		return appman.response.apiSuccess(res, { remainingTime: remainTime }, status.ATS029)
	} catch (error) {
		return appman.response.systemError(res, error)
	}
}

/**
* @url {host}/api/getListPhoneCode
* @method GET
* @queryParams N/A
* @pathParams N/A
* @body N/A
*/
const getListPhoneCode = async (req, res) => {
	try {
		const listPhoneCode = await service.getPhoneCode()
		return appman.response.apiSuccess(res, { listPhoneCode }, status.ATS029)
	} catch (error) {
		return appman.response.systemError(res, error)
	}
}

const logOut = async (req, res) => {
	try {
		const body = req.body
		const decoded = req.jwtDecoded
		const { error, value } = validation.logout.validate(body)
		if (error) {
			return appman.response.apiSuccess(res, {}, error.message)
		}
		const { email, refresh_token } = value
		const userData = await service.findUser({ email: email })
		const hash_refreshToken = crypto.SHA256(refresh_token).toString()
		const logout = await service.logOut({ user_id: userData.id, refreshToken: hash_refreshToken })
		//Delete access token in redis server when logout
		await tokenHandler.deleteAccessToken(decoded.data.jti)
		if (logout > 0) {
			return appman.response.apiSuccess(res, {}, status.ATS023)
		} else {
			return appman.response.apiSuccess(res, {}, status.ATF022)
		}
	} catch (error) {
		return appman.response.systemError(res, error)
	}
}

const changePassword = async (req, res) => {
	try {
		const body = req.body
		const { error } = validation.changepassword.validate(body)
		if (error) {
			return appman.response.apiSuccess(res, {}, error.message)
		}
		const decoded = req.jwtDecoded
		const email = decoded.data.email
		const options = {
			email: email
		}
		const userData = await service.findUser(options, true)
		const password = await service.findPassWordActive(userData.id)
		const isCorrectPassword = await service.comparePassword(body.old_password, password.hash_password)
		if (!isCorrectPassword) {
			return appman.response.apiSuccess(res, {}, status.ATF017)
		}
		if (isCorrectPassword && userData.status == 0) {
			return appman.response.apiSuccess(res, {}, status.ATF005)
		}
		const salt = userData.salt
		const hash_newpassword = await service.hashPassword(body.new_password, salt)
		const listOldPass = await service.findPasswordLastUsed(userData.id, 3)
		const isExist = listOldPass.map(e => e.hash_password).find(e => e === hash_newpassword)
		if (isExist) {
			return appman.response.apiSuccess(res, {}, status.ATF031)
		}
		const updatePasswordStatus = await service.updatePasswordStatus(userData.id)
		const saveNewPassword = await service.saveNewPassword({
			user_id: userData.id,
			hash_password: hash_newpassword
		})
		if (saveNewPassword && updatePasswordStatus) {
			const { accessToken } = await tokenHandler.generateToken({ user: userData, tokenLife: accessTokenLife, isFromCLient: true, jwtPrivateKeyClientPath: jwtPrivateKeyClientPath })
			const refreshToken = await tokenHandler.generateRefreshToken()
			const expired_at = Date.now() + appman.config.environments.server.token.refreshTokenLifeMilliseconds
			await tokenHandler.saveRefreshToken({
				refreshToken: refreshToken.refreshToken,
				user_id: userData.id,
				expired_at
			})
			return appman.response.apiSuccess(res, { accessToken: accessToken, refreshToken: refreshToken.token }, status.ATS018)
		}
	} catch (error) {
		return appman.response.systemError(res, error)
	}
}

const forgotPassword = async (req, res) => {
	try {
		const body = req.body
		const { error } = validation.forgotpassword.validate(body)
		if (error) {
			return appman.response.apiSuccess(res, {}, error.message)
		}
		const email = body.email.toLowerCase()
		const company = await dbUltil.getCompanyEnterpriseByDomain(email.split('@')[1])
		if (company.length > 0) {
			return appman.response.apiSuccess(res, {}, status.ATF059)
		}
		const userData = await service.findUser(body, true)
		if (!userData) {
			return appman.response.apiSuccess(res, {}, status.ATF028)
		}
		const step = appman.config.environments.server.otp_forgotpassword_step
		const otp = await service.createVerifyCode(userData.secret_key, step)

		const otp_issued_in = Date.now()
		await service.updateUserOtpExpired(email, otp_issued_in)

		//send-mail-forgotpassword
		const emailText = { en, ja }['en']['forgotpassword']
		const sender = appman.config.environments.server.mail.sender
		const template = path.resolve(__dirname, '..', '..', 'utilities/mail/templates/forgotpassword')
		const options = {
			template: template,
			emailText: emailText,
			data: {
				email: email,
				otp: otp
			}
		}
		sendMail(sender, options)

		return appman.response.apiSuccess(res, {}, status.ATS029)
	} catch (error) {
		return appman.response.systemError(res, error)
	}
}

const renewPassword = async (req, res) => {
	try {
		const body = req.body
		const { error } = validation.renewpassword.validate(body)
		if (error) {
			return appman.response.apiSuccess(res, {}, error.message)
		}
		const userData = await service.findUser(body, true)
		if (!userData) {
			return appman.response.apiSuccess(res, {}, status.ATF026)
		}
		const step = appman.config.environments.server.otp_forgotpassword_step
		const isCorrectOTP = await service.verifyOTP(body.otp, step, userData.secret_key)
		if (!isCorrectOTP) {
			return appman.response.apiSuccess(res, {}, status.ATF026)
		}
		const salt = userData.salt
		const hash_newpassword = await service.hashPassword(body.new_password, salt)
		const listOldPass = await service.findPasswordLastUsed(userData.id, 3)
		const isExist = listOldPass.map(e => e.hash_password).find(e => e === hash_newpassword)
		if (isExist) {
			return appman.response.apiSuccess(res, {}, status.ATF031)
		}
		await service.deleteRefeshToken(userData.id)
		const updatePasswordStatus = await service.updatePasswordStatus(userData.id)
		const saveNewPassword = await service.saveNewPassword({
			user_id: userData.id,
			hash_password: hash_newpassword
		})
		if (updatePasswordStatus && saveNewPassword) {
			const { accessToken } = await tokenHandler.generateToken({ user: userData, tokenLife: accessTokenLife, isFromCLient: true, jwtPrivateKeyClientPath: jwtPrivateKeyClientPath })
			const refreshToken = await tokenHandler.generateRefreshToken()
			const expired_at = Date.now() + appman.config.environments.server.token.refreshTokenLifeMilliseconds
			await tokenHandler.saveRefreshToken({
				refreshToken: refreshToken.refreshToken,
				user_id: userData.id,
				expired_at
			})
			return appman.response.apiSuccess(res, {
				accessToken: accessToken,
				refreshToken: refreshToken.token,
				user_name: userData.full_name,
				user_email: userData.email,
				avatar_url: userData.avatar_url
			}, status.ATS029)
		}
	} catch (error) {
		return appman.response.systemError(res, error)
	}
}

const recoverAccount = async (req, res) => {
	try {
		const body = req.body
		const { error } = validation.recoververify.validate(body)
		if (error) {
			return appman.response.apiSuccess(res, {}, error.message)
		}
		const userData = await service.findUser(body, true)
		if (!userData) {
			return appman.response.apiSuccess(res, {}, status.ATF026)
		}
		if (Date.now() > userData.otp_issued_in + appman.config.environments.server.otp_forgotpassword_step * 1000) {
			return appman.response.apiSuccess(res, {}, status.ATF035)
		}
		const step = appman.config.environments.server.otp_forgotpassword_step
		const isCorrectOTP = await service.verifyOTP(body.otp, step, userData.secret_key)
		if (!isCorrectOTP) {
			return appman.response.apiSuccess(res, {}, status.ATF014)
		}
		return appman.response.apiSuccess(res, {}, status.ATS013)
	} catch (error) {
		return appman.response.systemError(res, error)
	}
}

const getUserInfo = async (req, res) => {
	try {
		const email = req.jwtDecoded.data.email
		const companies = await company_service.getListCompany(req.jwtDecoded.data.user_id)
		const userData = await service.findUser({ email: email }, false);

		// Verify token
		// const cert = fs.readFileSync(appman.config.environments.server.openssl.publicKeyClientPath);
		// const decoded = jwt.verify(accessToken, cert, { algorithms: 'RS256' });
		// const decodedData = decoded.data;

		// Find user's role
		const rolesRs = await service.getRolesByUserId(req.jwtDecoded.data.user_id);
		const myRoleGroups = appman.acl.buildSimpleRoleListFromRecordSet(rolesRs);

		// Save ACL of user to Cache system
		// Modify key save temp data acl to redis of user at 09/04/2020 (cant use jti to identity key)
		// await appman.acl.saveRoleOfUserToCache(email, myRoleGroups);

		if (userData) {
			return appman.response.apiSuccess(res, {
				full_name: userData.full_name,
				email: userData.email,
				nationality: userData.nationality,
				country_code: userData.country_code,
				phone: userData.phone,
				address: userData.address,
				birth_day: userData.birth_day,
				gender: userData.gender,
				role: req.jwtDecoded.data.role,
				avatar_url: userData.avatar_url,
				lang: userData.lang,
				mfa: userData.mfa,
				companies: companies,
				aclList: appman.acl.buildClientACLListFromSimpleRoleGroup(myRoleGroups),
				aclRights: appman.acl.rights,
				aclRoleGroups: appman.acl.roleGroups,
			}, status.ATS029)
		} else {
			return appman.response.apiSuccess(res, {}, status.ATF026)
		}
	} catch (error) {
		return appman.response.systemError(res, null, appman.response.status[401]);
	}
}

const editUserInfo = async (req, res) => {
	try {
		const body = req.body
		if (body.full_name || body.email) {
			if (req.jwtDecoded.data.role === constant.user.role.enterprise) {
				return appman.response.systemError(res, null, appman.response.status[602]);
			}
		}
		const { error } = validation.editinfo.validate(body)
		if (error) {
			return appman.response.apiSuccess(res, {}, status.ATF026)
		}
		const email = req.jwtDecoded.data.email
		const updateOptions = {
			email: email
		}
		for (const key in body) {
			updateOptions[key] = body[key]
			if (((body.phone === '' || body.phone) && body.country_code === undefined) || (body.country_code && (body.phone === '' || body.phone === undefined))) {
				updateOptions['country_code'] = null
				updateOptions['phone'] = null
			}
		}
		const userData = await service.updateUserProfile(updateOptions)
		if (userData) {
			const user = await service.findUser({ email: email }, false)
			return appman.response.apiSuccess(res, {
				email: email,
				full_name: user.full_name,
				nationality: user.nationality,
				country_code: user.country_code,
				phone: user.phone,
				address: user.address,
				birth_day: user.birth_day,
				gender: user.gender,
				role: req.jwtDecoded.data.role
			}, status.ATS027)
		} else {
			return appman.response.apiSuccess(res, {}, status.ATF026)
		}
	} catch (error) {
		return appman.response.systemError(res, error)
	}
}

const getListColleague = async (req, res) => {
	const query = req.query
	const { error, value } = validation.getListColleague.validate(query)
	if (error) {
		return appman.response.apiSuccess(res, {}, status.ATF026)
	}
	const { pageIndex, pageSize, company_id } = value
	const listColleague = await service.getListColleague({
		getAll: false,
		offset: pageIndex,
		limit: pageSize,
		company_id: company_id,
		email: query.email,
		name: query.name
	})
	const total = await service.getListColleague({
		getAll: true,
		offset: pageIndex,
		limit: pageSize,
		company_id: company_id,
		email: query.email,
		name: query.name
	})
	return appman.response.apiSuccess(res, { users: listColleague, total: total.length }, status.ATS029)
}

const getOTP = async (req, res) => {
	const email = req.query.email
	const user = await service.findUser({ email }, false)
	const otpCode = await service.createVerifyCode(user.secret_key)
	if (appman.config.nodeEnv !== 'production') {
		return appman.response.apiSuccess(res, { otpCode }, status.ATS029)
	}
	else {
		return appman.response.apiSuccess(res, {}, status.ATS029)
	}
}
/**
	* @url {host}/api/users/get-user-by-email
	* @method GET
	* @queryParams N/A
	* @pathParams N/A
	* @body emails
	*/
const getUserByEmails = async (req, res) => {
	try {

		// Validate & get request body
		const { emails } = await validation.getUserByEmailsReqBody.validateAsync(req.body);

		// Get the response data
		const responseData = await service.getUserByEmails(emails);

		appman.response.apiSuccess(res, responseData);
	} catch (error) {
		appman.response.systemError(res, error);
	}
};

/**
	* @url {host}/api/users/update-lang
	* @method POST
	* @queryParams N/A
	* @pathParams N/A
	* @body emails
	*/
const updateUserLanguage = async (req, res) => {
	try {
		service.updateUserLanguage(req.jwtDecoded.data.user_id, req.headers.lang.toLowerCase());
		appman.response.apiSuccess(res, {});
	} catch (error) {
		appman.response.systemError(res, error);
	}
};

const uploadAvatar = async (req, res) => {
	try {
		const user_id = req.userData.user_id;
		const user = await service.findUserById(user_id);
		if (!user) {
			return appman.response.systemError(res);
		}

		const results = await file.saveUploadFile(req, { fileKey: AVATAR.UPLOADED_FILE_KEY, allowedFileTypes: AVATAR.ALLOWED_FILE_TYPES, maxFileSize: AVATAR.MAX_FILE_SIZE });
		// Stop process if the uploaded file is invalid
		if (_.isNull(results) || results.storageErrors) {
			return appman.response.apiSuccess(res, {}, status.ATF026);
		}

		const objUpdate = { avatar_url: results };
		await service.updateUser(user_id, objUpdate);
		if (user.avatar_url) {
			const deleteFilePath = await file.getFilePath(user.avatar_url);
			await file.deleteFile(deleteFilePath);
		}
		return appman.response.apiSuccess(res, results, status.ATS068);

	} catch (err) {
		return appman.response.systemError(res, err);
	}
}

/**
* @url {host}/api/admin/users
* @method GET
* @queryParams pageSize, pageIndex
* @pathParams N/A
* @body N/A
*/
const getUsers = async (req, res) => {
	try {
		const { pageSize, pageIndex, email, stt, role } = await validation.getUsers.validateAsync(req.query);
		let whereOption = {}
		if (email) {
			whereOption['email'] = email
		}
		if (stt) {
			whereOption['status'] = stt;
		}
		if (role) {
			whereOption['role'] = role;
		}
		const user_id = req.userData.user_id;
		const user = await service.findUserById(user_id);
		if (!user || user.role !== constant.user.role.admin) {
			return appman.response.systemError(res);
		}
		const users = await service.getUsers(pageSize, pageIndex, whereOption);

		// Remove sensitive infomation
		users.rows.forEach(user => {
			delete user.salt
			delete user.secret_key
			delete user.otp_issued_in
		})

		// Handle expired users
		await service.handleExpiredUsers(users.rows, constant.user.status.inactive);

		return appman.response.apiSuccess(res, users, status.ATS029);
	} catch (error) {
		return appman.response.systemError(res, error);
	}
}

/**
* @url {host}/api/admin/user/create
* @method POST
* @queryParams N/A
* @pathParams N/A
* @body 
*/
const createUser = async (req, res) => {
	try {
		const value = await validation.register.validateAsync(req.body)
		const user_id = req.userData.user_id;
		const currentUser = await service.findUserById(user_id);
		const userData = await service.findUser(value, true);
		if (!currentUser || currentUser.role !== constant.user.role.admin) {
			return appman.response.systemError(res);
		}
		if (userData) {
			return appman.response.apiSuccess(res, {}, status.ATF013)
		}

		// Init default sync request
		const reqData = {};

		// Sync user from atomid if user info exist
		if (value.email && value.full_name) {
			/** Config request data to sync user in tester40 */
			reqData.email = value.email;
			reqData.fullName = value.full_name;

			// Sync the user on Tester40 with the 'user' role
			const syncUserT40 = await service.syncTester40User(reqData);

			// Stop process if sync user to tester40 failed
			if (!syncUserT40.status) {
				const responseStatus = _.clone(status.ATF069);
				responseStatus.message = syncUserT40.message;
				return appman.response.apiSuccess(res, {}, responseStatus);
			}

			// Init sync request to device farm
			const requestDataDeviceFarm = _.clone(reqData);

			// Set default role to request
			requestDataDeviceFarm.role = SYNC_USER_ROLE_DF[5];

			// Sync the user on DeviceFrm with 'guest' role
			const syncUserDeviceFarm = await service.syncDeviceFarmUser(requestDataDeviceFarm);

			// Stop process if sync user to device farm failed
			if (!syncUserDeviceFarm.status) {
				const responseStatus = _.clone(status.ATF069);
				responseStatus.message = syncUserDeviceFarm.message;
				return appman.response.apiSuccess(res, {}, responseStatus);
			}
		}

		const salt = await service.createSalt();
		const password = value.password ? value.password : service.passwordGenerator(10);
		const hash_password = await service.hashPassword(password, salt);
		const secret_key = await service.createSecretKey();
		const otp_issued_in = Date.now();
		let user = await service.createUser({
			lang: req.headers.lang.toLowerCase(),
			body: value,
			status: constant.user.status.active,
			secret_key: secret_key,
			salt: salt,
			otp_issued_in: otp_issued_in
		});
		await service.saveNewPassword({
			user_id: user.id,
			hash_password: hash_password
		});
		return appman.response.apiSuccess(res, { user: { id: user.id, email: user.email, full_name: user.full_name }, password: password }, status.ATS029);
	} catch (error) {
		return appman.response.systemError(res, error);
	}
}

/**
 * @url {host}/api/admin/user/bulk-create
 * @method POST
 * @queryParams N/A
 * @pathParams N/A
 * @body
 */
const bulkCreateUsers = async (req, res) => {
	try {
		const user_id = req.userData.user_id;
		const currentUser = await service.findUserById(user_id);
		if (!currentUser || currentUser.role !== constant.user.role.admin) {
			return appman.response.systemError(res);
		}
		
		const errors = []

		const { users } = req.body;
		for (const user of users) {
			try {
				const value = await validation.register.validateAsync(user);
				const userData = await service.findUser(value, true);
				if (userData) {
					errors.push({
						user: user.email,
						status: status.ATF013
					})
				}
			} catch (error) {
				errors.push({
					user: user.email,
					status: status.ATF001
				})
			}
		}

		if (errors.length > 0)
			return appman.response.apiSuccess(res, { errors }, status.ATF070)

		for (const user of users) {
			const reqData = {};
			// Sync user from atomid if user info exist
			if (user.email && user.full_name) {
				/** Config request data to sync user in tester40 */
				reqData.email = user.email;
				reqData.fullName = user.full_name;

				// Sync the user on Tester40 with the 'user' role
				const syncUserT40 = await service.syncTester40User(reqData);

				// Stop process if sync user to tester40 failed
				if (!syncUserT40.status) {
					const responseStatus = _.clone(status.ATF069);
					if (syncUserT40.message) responseStatus.message = syncUserT40.message;
					errors.push({
						user: user.email,
						status: responseStatus
					})
				}

				// Init sync request to device farm
				const requestDataDeviceFarm = _.clone(reqData);

				// Set default role to request
				requestDataDeviceFarm.role = SYNC_USER_ROLE_DF[5];

				// Sync the user on DeviceFrm with 'guest' role
				const syncUserDeviceFarm = await service.syncDeviceFarmUser(requestDataDeviceFarm);

				// Stop process if sync user to device farm failed
				if (!syncUserDeviceFarm.status) {
					const responseStatus = _.clone(status.ATF069);
					if (syncUserDeviceFarm.message) responseStatus.message = syncUserDeviceFarm.message;
					errors.push({
						user: user.email,
						status: responseStatus
					})
				}
			}

			if (errors.length > 0)
				return appman.response.apiSuccess(res, { errors }, status.ATF070)

			const salt = await service.createSalt();
			const secret_key = await service.createSecretKey();

			user.lang = req.headers.lang.toLowerCase();
			user.salt = salt;
			user.status = constant.user.status.active;
			user.secret_key = secret_key;
			user.otp_issued_in = Date.now();
			user.role = constant.user.role.guest;
		}

		const created = await service.bulkCreateUsers({ users })

		return appman.response.apiSuccess(res, created, status.ATS029)

	} catch (error) {
		return appman.response.systemError(res, error)
	}
}

/**
* @url {host}/api/admin/user/reset/password
* @method PUT
* @queryParams N/A
* @pathParams N/A
* @body user_id
*/
const resetPassword = async (req, res) => {
	try {
		const { userId } = await validation.resetPassword.validateAsync(req.body);
		const user_id = req.userData.user_id;
		const currentUser = await service.findUserById(user_id);
		const user = await service.findUserById(userId);
		if (!currentUser || currentUser.role !== constant.user.role.admin) {
			return appman.response.systemError(res);
		}
		if (!user) {
			return appman.response.systemError(res);
		}
		await service.updatePasswordStatus(user.id);
		const password = service.passwordGenerator(10);
		const hash_newpassword = await service.hashPassword(password, user.salt);
		await service.saveNewPassword({
			user_id: user.id,
			hash_password: hash_newpassword
		});
		return appman.response.apiSuccess(res, { user: { id: user.id, email: user.email, full_name: user.full_name }, password: password }, status.ATS029);
	} catch (error) {
		return appman.response.systemError(res, error);
	}
}

const updateMFA = async (req, res) => {
	try {
		const user_id = req.userData.user_id;
		const currentUser = await service.findUserById(user_id);
		await service.updateMFA(currentUser.id, req.body.mfa);

		if (req.body.mfa) {
			const secretKey = speakeasy.generateSecret().ascii;

			var url = speakeasy.otpauthURL({
				secret: secretKey,
				label: currentUser.email,
				issuer: 'ATOMP'
			});

			await service.updateUserOTPSecret(currentUser.email, secretKey);
			QRCode.toDataURL(url, (err, dataURL) => {
				return appman.response.apiSuccess(res, { dataURL: dataURL }, status.ATS029);
			});
		} else {
			return appman.response.apiSuccess(res, 'success', status.ATS029);
		}

	} catch (error) {
		return appman.response.systemError(res, error);
	}
}

const changePasswordPublic = async (req, res) => {
	try {
		let user = {}
		const body = req.body
		//Validate params
		const { email, password, new_password } = await validation.changePasswordPublic.validate(body).value;

		console.warn(`Log in with ATOMP authentication for user [${email}]`)
		//login with nonenterprise company
		user = await service.login(body)

		// Check user isActive
		if (!user || user.status === constant.user.status.inactive) {
			return appman.response.apiSuccess(res, {}, status.ATF032)
		}

		const options = {
			email: email
		}
		const userData = await service.findUser(options, true)
		const listOldPass = await service.findPasswordLastUsed(userData.id, 3)

		const hash_newpassword = await service.hashPassword(body.new_password, userData.salt)
		const isExist = listOldPass.map(e => e.hash_password).find(e => e === hash_newpassword)
		if (isExist) {
			return appman.response.apiSuccess(res, {}, status.ATF031)
		}

		const updatePasswordStatus = await service.updatePasswordStatus(userData.id)
		const saveNewPassword = await service.saveNewPassword({
			user_id: userData.id,
			hash_password: hash_newpassword
		})

		if (saveNewPassword && updatePasswordStatus) {
			return appman.response.apiSuccess(res, 'success', status.ATS018)
		} else {
			return appman.response.systemError(res, null, appman.response.status[500]);
		}
	} catch (error) {
		return appman.response.systemError(res, error)
	}
}

const adminUpdateMFA = async (req, res) => {
	try {
		const user_id = req.userData.user_id;
		const currentUser = await service.findUserById(user_id);

		if (!currentUser || currentUser.role !== constant.user.role.admin) {
			return appman.response.systemError(res);
		}

		await service.updateMFA(req.body.user_id, req.body.mfa);

		if (req.body.mfa) {
			const secretKey = speakeasy.generateSecret().ascii;

			var url = speakeasy.otpauthURL({
				secret: secretKey,
				label: req.body.email,
				issuer: 'ATOMP'
			});

			await service.updateUserOTPSecret(req.body.email, secretKey);
			QRCode.toDataURL(url, (err, dataURL) => {
				return appman.response.apiSuccess(res, { dataURL: dataURL }, status.ATS029);
			});
		} else {
			return appman.response.apiSuccess(res, 'success', status.ATS029);
		}

	} catch (error) {
		return appman.response.systemError(res, error);
	}
}

// PUT {root}/atomid/user/change-status
// Body: id, status
const changeUserStatus = async (req, res) => {
	try {
		// Validate request body
		const updateData = validation.changeUserStatusReqBody.validate(req.body).value;

		// Get user info
		const userInfo = await service.findUserByPk(updateData.id, ['id', 'status']);

		// Stop process if user does not exist
		if (!userInfo) {
			return appman.response.systemError(res);
		}

		// Set update data
		const updateObject = { status: updateData.status };

		// Set expired date if active user
		if (updateData.status === constant.user.status.active) {
			updateObject.expired_at = updateData.expiredDate
		}

		// Update user status
		await service.updateUser(updateData.id, updateObject);

		return appman.response.apiSuccess(res, {}, status.ATS001);
	} catch (err) {
		appman.response.systemError(res, err);
	}
}

// GET {root}/atomid/users
// Query params: status, role, email
const getAllUsers = async (req, res) => {
	try {
		// Validate query params
		const queryParams = await validation.getAllUsersReqQuery.validateAsync(req.query);

		// Get all users
		const users = await service.getAllUsers(queryParams);

		return appman.response.apiSuccess(res, users, status.ATS029);
	} catch (error) {
		return appman.response.systemError(res, error);
	}
}

// PUT {root}/atomid/user/change-role
// Body: id, roleId
const changeUserRole = async (req, res) => {
	try {
		const user_id = req.userData.user_id;
		const currentUser = await service.findUserById(user_id);
		if (!currentUser || currentUser.role !== constant.user.role.admin) {
			return appman.response.systemError(res);
		}
		// Validate request body
		const updateData = validation.changeUserStatusReqBody.validate(req.body).value;

		// Get user info
		const userInfo = await service.findUserByPk(updateData.id, ['id', 'role', 'email']);

		// Stop process if user does not exist
		if (!userInfo) {
			return appman.response.systemError(res);
		}

		// Init default sync request
		const reqData = {};

		// Sync user from atomid if user info exist
		if (userInfo.email && updateData.role) {
			/** Config request data to sync user in tester40 */
			reqData.email = userInfo.email;
			reqData.roleId = updateData.role;

			// Sync the user on Tester40 with role
			const syncUserT40 = await service.syncTester40User(reqData);

			// Stop process if sync user to tester40 failed
			if (!syncUserT40.status) {
				const responseStatus = _.clone(status.ATF069);
				responseStatus.message = syncUserT40.message;
				return appman.response.apiSuccess(res, {}, responseStatus);
			}

			// Init sync request to device farm
			const requestDataDeviceFarm = {
				email: userInfo.email,
				role: SYNC_USER_ROLE_DF[updateData.role] || SYNC_USER_ROLE_DF[5]
			};

			// Sync the user on DeviceFrm with role
			const syncUserDeviceFarm = await service.syncDeviceFarmUser(requestDataDeviceFarm);

			// Stop process if sync user to device farm failed
			if (!syncUserDeviceFarm.status) {
				const responseStatus = _.clone(status.ATF069);
				responseStatus.message = syncUserDeviceFarm.message;
				return appman.response.apiSuccess(res, {}, responseStatus);
			}

			// In case change user role to guest, need remove to all assigned company
			if (updateData.role === constant.user.role.guest) {
				await company_service.removeUserCompany(userInfo.id);
			}
		}

		// Set update data
		const updateObject = { role: updateData.role };

		// Update user status
		await service.updateUser(updateData.id, updateObject);

		return appman.response.apiSuccess(res, {}, status.ATS002);
	} catch (err) {
		appman.response.systemError(res, err);
	}
}

module.exports = {
	register,
	getListNationality,
	login,
	verifyToken,
	verifyEmail,
	generateOTP,
	getRemainingTime,
	getListPhoneCode,
	logOut,
	changePassword,
	forgotPassword,
	renewPassword,
	recoverAccount,
	getUserInfo,
	editUserInfo,
	getListColleague,
	getOTP,
	getUserByEmails,
	updateUserLanguage,
	uploadAvatar,
	getUsers,
	createUser,
	bulkCreateUsers,
	resetPassword,
	updateMFA,
	changePasswordPublic,
	adminUpdateMFA,
	changeUserStatus,
	getAllUsers,
	changeUserRole
}
