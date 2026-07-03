/**
 * Copyright (C) 2019 Global Smart Technologies - All Rights Reserved
 *
 */

/**
 * Bootstrap
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const auth = require('./app/middleware/auth');
const { serverLogger } = require('./app/utilities/logger');
const Promise = require('bluebird');
const helmet = require('helmet');

/** Init express app */
const app = express();

/** Init "appman" - global application manager */
global.appman = {};

/** Init response manager */
const responseUtil = require('./app/utilities/response');
global.appman.response = responseUtil;

/** Init configuration manager */
const configUtil = require('./app/utilities/config');
global.appman.config = configUtil;

/** Init database manager */
const dbUtil = require("./app/utilities/db-manager");
global.appman.db = dbUtil;

/** Connect redis server - create redis client */
const redis = require('redis');
Promise.promisifyAll(redis);
// Create a connection to connect redis database
const redisClient = redis.createClient({
    host: configUtil.environments.server.redis.host,
    port: configUtil.environments.server.redis.port
});
global.appman.redis = redisClient;
global.appman.redis.select(configUtil.environments.server.redis.database, (err, res) => {
    if (err) {
        console.log(`⚠️ Cannot select redis database.`);
        console.log(err);
        return;
    }
    console.log('Redis database was selected.');
});

/** Init multiple languages engine */
// Ref: https://github.com/mashpie/i18n-node
const i18n = require('i18n');
i18n.configure({
	locales: ['en', 'ja'],
	defaultLocale: configUtil.application.defaultLocale,
	directory: path.join(__dirname, '/config/locales'),
	cookie: 'ulang',
	queryParameter: 'lang',
	preserveLegacyCase: true
});

/** Init router ultility */
const routerUtil = require('./app/utilities/router');

/** Init ACL - Access Control List */
const acl = require('./app/utilities/acl-atomid');
global.appman.acl = acl;

/** Setup app */
// only using cors when environment not equal production
// if (configUtil.nodeEnv !== 'production') {
	// app.use(cors());
// }

// app.use(cors());
app.use(serverLogger);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use('/api', [i18n.init, auth, routerUtil.loadSubRouters(path.join(__dirname, '/app/api'))]);
// app.use('/api-docs', express.static(path.join(__dirname, 'design_api')));

app.use(express.static(path.join(__dirname, '/public')));
app.get('/*', (req, res) => {
	res.sendFile(path.join(__dirname, '/public/index.html'));
});


/** Boot Server */
const runTimeConfig = {
	launchedAt: Date.now(),
	appPath: process.cwd(),
	appVersion: configUtil.application.appVersion,
	host: configUtil.environments.server.host,
	port: configUtil.environments.server.port,
	environment: configUtil.nodeEnv,
	locale: configUtil.application.defaultLocale,
};

app.listen(runTimeConfig.port, (err) => {
	if (err) {
		console.log(`⚠️ Server wasn't able to start properly.`);
		console.error(err);
		return;
	}
	console.log('=========================================================');
	console.info('Time: ' + new Date());
	console.info('Launched in: ' + (Date.now() - runTimeConfig.launchedAt) + ' ms');
	console.info('Environment: ' + runTimeConfig.environment);
	console.info('Process PID: ' + process.pid);
	console.info('App path: ' + runTimeConfig.appPath);
	console.info('App version: ' + runTimeConfig.appVersion);
	console.info('Locale: ' + runTimeConfig.locale);
	console.info('To shut down your server, press <CTRL> + C at any time');
	console.log('=========================================================');
	console.info(`⚡️ Server: ${runTimeConfig.host}:${runTimeConfig.port}`);
	console.log('=========================================================');
});
