/**
 * Copyright (C) 2020 Global Smart Technologies - All Rights Reserved
 *
 */

/**
 * Invitations Controller
 */
const service = require('./invitations.service');
const status = require('./invitations.response-status');
const validation = require('./invitations.validation');
const constant = require('../../utilities/constant')
const users_service = require('../users/users.service')
const companies_service = require('../companies/companies.service')
const group_service = require('../groups/groups.service')
const lodash = require("lodash")
const { sendMail } = require("../../utilities/mail/mail")
const path = require('path')
const host = appman.config.environments.server.host
const en = require('../../utilities/mail/language/en.json')
const ja = require('../../utilities/mail/language/ja.json')
const crypto = require('crypto-js')
const userService = require('../users/users.service');
const commomUtil = require('../../utilities/common');
const dbUltil = require('../../utilities/db-util')

const inviteMember = async (req, res) => {
    try {
        const body = req.body
        let listRecipientEmail = body.recipient_email
        const user_id = req.jwtDecoded.data.user_id
        if (listRecipientEmail.length > 50) {
            return appman.response.apiSuccess(res, {}, status.ATF045)
        }
        listRecipientEmail = listRecipientEmail.map(e => e.replace(/\.(?=.*?@\w+)/g,''))
        //GST.HIeuPD2 - Don't add user enterprise to another company
        // listRecipientEmail.forEach(async (email) => {
        //     const company = await dbUltil.getCompanyEnterpriseByDomain(email.split('@')[1])
        //     if(company.length > 0) {
        //         return appman.response.apiSuccess(res, {}, status.ATF068)
        //     }
        // })
        const listUser = await group_service.findAllUserInCompany({
            company_id: body.company_id
        })
        const result = lodash.intersectionWith(listUser.map(e => e.email), listRecipientEmail, (i, email) => i.toLowerCase() === email.toLowerCase());
        if (result.length > 0) {
            for (let index = 0; index < result.length; index++) {
                const email = result[index];
                const urs = await users_service.findUser({ email: email }, true)
                const user_company = await group_service.findUserInCompany({
                    user_id: urs.id,
                    company_id: body.company_id
                })
                if(user_company.status === constant.company_user.status.inactive) {
                    return appman.response.apiSuccess(res, { email_existed: result}, status.ATF059)
                }
            }
            return appman.response.apiSuccess(res, { email_existed: result}, status.ATF053)
        }
        const urser = await users_service.findUserById(user_id)
        let senderName = urser.email.split('@')[0].charAt(0).toUpperCase() + urser.email.split('@')[0].slice(1)
        if (urser && urser.full_name) {
            senderName = urser.full_name
        }
        const company = await companies_service.findCompanyByCompanyId(body.company_id)
        for (let index = 0; index < listRecipientEmail.length; index++) {
            let email = listRecipientEmail[index];
            const count = listRecipientEmail.filter(e => e === email).length
            if (count > 1) {
                return appman.response.apiSuccess(res, {}, status.ATF026)
            }
            email = email.toLowerCase()
            const urs = await users_service.findUser({ email }, true)
            const hash_token = await service.genAndHashToken()
            const invatition = await service.saveInvitation({
                company_id: body.company_id,
                requester_id: user_id,
                recipient_email: email,
                hash_token: hash_token.hash,
            })
            let name = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)
            if (urs && urs.full_name) {
                name = urs.full_name
            }
            const acceptUrl = `${host}/api/admin/company/${body.company_id}/invitation/confirm?token=${hash_token.token}&de=a`
            const sender = appman.config.environments.server.mail.sender
            const template = path.resolve(__dirname, '..', '..', 'utilities/mail/templates/invitations')
            const options = {
                data: {
                    senderEmail: urser.email,
                    email: email,
                    acceptUrl: acceptUrl,
                    name: name,
                    companyName: company.name,
                    senderName: senderName
                },
                emailText: { en, ja }['en']['invitations'],
                template: template,
            }

            sendMail(sender, options)
        }
        return appman.response.apiSuccess(res, {}, status.ATS058)
    } catch (error) {
        return appman.response.systemError(res, error)
    }
}

const confirmMember = async (req, res) => {
    try {
        const query = req.query
        const params = req.params
        const company_id = params.company_id
        const token = query.token
        const hash_token = crypto.SHA256(token).toString()
        const invitation = await service.getInvatationStatus({
            company_id: company_id,
            hash_token: hash_token
        })

	console.log(invitation);
        if (!invitation) {
            return res.redirect(`${host}/not-found`)
        }
        const urs = await users_service.findUser({ email: invitation.recipient_email }, true)
        if (!urs) {
            //redirect to page register
            return res.redirect(`${host}/register`)
        }
        const user = await group_service.findUserInCompany({
            user_id: urs.id,
            company_id: invitation.company_id
        })
        if (user) {
            return res.redirect(`${host}/home`)
        }
        if (invitation.status === constant.invitation.status.pending) {
            await service.updateInvitationStatus({
                status: constant.invitation.status.accepted,
                recipient_email: urs.email,
                company_id: invitation.company_id
            })
            await companies_service.addCompanyUser({
                user_id: urs.id,
                company_id: company_id,
                status: constant.company.status.active,
                role: constant.company_user.role.normaluser
            })

            // Find user's role
            const rolesRs = await userService.getRolesByUserId(urs.id);

            // Fetch acl list of user created this group
            await commomUtil.fetchAclList(rolesRs, urs.email);

            return res.redirect(`${host}/home`)
        }
        if (invitation.status === constant.invitation.status.accepted) {
            return res.redirect(`${host}/home`)
        }
        return appman.response.apiSuccess(res, {}, status.ATS029)
    } catch (error) {
        return appman.response.systemError(res, error)
    }
}

const deleteInvitations = async (req, res) => {
    try {
        const body = req.body
        const { value, error } = validation.deleteInvitations.validate(body)
        if (error) {
            return appman.response.apiSuccess(res, {}, status.ATF026)
        }
        const { company_id, invitations_email } = value
        if (invitations_email.length > 50) {
            return appman.response.apiSuccess(res, {}, status.ATF050)
        }
        const checkDelete = async (invitations_email) => {
            for (let index = 0; index < invitations_email.length; index++) {
                const email = invitations_email[index];
                const invite = await service.getInvationByEmail({
                    email: email,
                    company_id: company_id
                })
                if (invite && invite.status === constant.invitation.status.accepted) {
                    return false
                }
                return true
            }
        }
        const isDelete = await checkDelete(invitations_email)
        if (!isDelete) {
            return appman.response.apiSuccess(res, {}, status.ATF056)
        }
        invitations_email.forEach(async (email) => {
            await service.deleteInvitationsByEmail({
                company_id: company_id,
                email: email
            })
        });
        return appman.response.apiSuccess(res, {}, status.ATS047)
    } catch (error) {
        return appman.response.systemError(res, error)
    }
}

const getListInvitations = async (req, res) => {
    try {
        const query = req.query
        const { value, error } = validation.getListInvitations.validate(query)
        if (error) {
            return appman.response.apiSuccess(res, {}, status.ATF026)
        }
        const { pageIndex, pageSize, company_id } = value
        let total
        const invitaions = await service.getlistInvitations({
            limit: pageSize,
            offset: pageIndex,
            company_id: company_id,
            name: query.name,
            status: query.status,
            email: query.email
        })
        const invitation = []
        for (let index = 0; index < invitaions.length; index++) {
            const element = invitaions[index];
            const item = {
                id: element.id,
                recipient_email: element.recipient_email,
                full_name: element.full_name,
                status: element.status,
                createdAt: element.createdAt,
            }
            if (element.status === constant.invitation.status.accepted) {
                item.updatedAt = element.updatedAt
            }
            invitation.push(item)
        }
        if (query.name || query.status || query.email) {
            total = await service.countQueryInvitations({
                limit: pageSize,
                offset: pageIndex,
                company_id: company_id,
                name: query.name,
                status: query.status,
                email: query.email
            })
        } else {
            total = await service.countInvitations(company_id)
        }
        return appman.response.apiSuccess(res, { invitaions: invitation, total: total }, status.ATS029)
    } catch (error) {
        return appman.response.systemError(res, error)
    }
}

module.exports = {
    deleteInvitations,
    confirmMember,
    inviteMember,
    getListInvitations
}
