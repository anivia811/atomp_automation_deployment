"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const support_1 = require("@appium/support");
const axios_1 = __importDefault(require("axios"));
const asyncbox_1 = require("asyncbox");
const webdriverio_1 = require("webdriverio");
const extension_1 = require("../../lib/cli/extension");
const constants_1 = require("../../lib/constants");
const extension_2 = require("../../lib/extension");
const extension_config_1 = require("../../lib/extension/extension-config");
const main_1 = require("../../lib/main");
const schema_1 = require("../../lib/schema");
const helpers_1 = require("../helpers");
const chai_1 = require("chai");
const FAKE_ARGS = { sillyWebServerPort: 1234, host: 'hey' };
const FAKE_PLUGIN_ARGS = { fake: FAKE_ARGS };
const wdOpts = {
    hostname: helpers_1.TEST_HOST,
    connectionRetryCount: 0,
    capabilities: helpers_1.W3C_PREFIXED_CAPS,
};
let baseServerArgs;
function serverSetup(args) {
    let server = null;
    /* eslint-disable mocha/no-top-level-hooks -- hooks are intentionally in a helper */
    before(async function () {
        server = await (0, main_1.main)({ ...baseServerArgs, ...args });
    });
    after(async function () {
        if (server) {
            await server.close();
        }
    });
    /* eslint-enable mocha/no-top-level-hooks */
}
describe('FakePlugin w/ FakeDriver via HTTP', function () {
    let appiumHome;
    let testServerBaseUrl;
    let port;
    let testServerBaseSessionUrl;
    before(async function () {
        (0, schema_1.resetSchema)();
        appiumHome = await support_1.tempDir.openDir();
        wdOpts.port = port = await (0, helpers_1.getTestPort)();
        testServerBaseUrl = `http://${helpers_1.TEST_HOST}:${port}`;
        testServerBaseSessionUrl = `${testServerBaseUrl}/session`;
        const { driverConfig, pluginConfig } = await (0, extension_2.loadExtensions)(appiumHome);
        // first ensure we have fakedriver installed
        const driverList = await (0, extension_1.runExtensionCommand)({
            driverCommand: 'list',
            showInstalled: true,
            subcommand: constants_1.DRIVER_TYPE,
            suppressOutput: true,
        }, driverConfig);
        if (!('fake' in driverList)) {
            await (0, extension_1.runExtensionCommand)({
                driverCommand: 'install',
                driver: helpers_1.FAKE_DRIVER_DIR,
                installType: extension_config_1.INSTALL_TYPE_LOCAL,
                subcommand: constants_1.DRIVER_TYPE,
            }, driverConfig);
        }
        const pluginList = await (0, extension_1.runExtensionCommand)({
            pluginCommand: 'list',
            showInstalled: true,
            subcommand: constants_1.PLUGIN_TYPE,
            json: true,
            suppressOutput: true,
        }, pluginConfig);
        if (!('fake' in pluginList)) {
            await (0, extension_1.runExtensionCommand)({
                pluginCommand: 'install',
                subcommand: constants_1.PLUGIN_TYPE,
                plugin: helpers_1.FAKE_PLUGIN_DIR,
                installType: extension_config_1.INSTALL_TYPE_LOCAL,
            }, pluginConfig);
        }
        baseServerArgs = {
            appiumHome,
            port,
            address: helpers_1.TEST_HOST,
            usePlugins: ['fake'],
            useDrivers: ['fake'],
        };
    });
    after(async function () {
        await support_1.fs.rimraf(appiumHome);
    });
    describe('without plugin registered', function () {
        it('should reject server creation if plugin is not activated', async function () {
            const args = {
                appiumHome,
                port,
                address: helpers_1.TEST_HOST,
                usePlugins: ['other1', 'other2'],
            };
            await (0, chai_1.expect)((0, main_1.main)(args)).to.eventually.be.rejected;
        });
        it('should reject server creation if reserved plugin name is provided with other names', async function () {
            const args = {
                appiumHome,
                port,
                address: helpers_1.TEST_HOST,
                usePlugins: ['fake', 'all'],
            };
            await (0, chai_1.expect)((0, main_1.main)(args)).to.eventually.be.rejected;
        });
    });
    for (const registrationType of ['explicit', 'all']) {
        describe(`with plugin registered via type ${registrationType}`, function () {
            const usePlugins = registrationType === 'explicit' ? ['fake'] : ['all'];
            serverSetup({ usePlugins });
            it('should update the server', async function () {
                const res = { fake: 'fakeResponse' };
                (0, chai_1.expect)((await axios_1.default.post(`http://${helpers_1.TEST_HOST}:${port}/fake`)).data).to.eql(res);
            });
            it('should update the server with cliArgs', async function () {
                const res = usePlugins;
                // we don't need to check the entire object, since it's large, but we can ensure an
                // arg got through.
                (0, chai_1.expect)((await axios_1.default.post(`http://${helpers_1.TEST_HOST}:${port}/cliArgs`)).data.usePlugins).to.eql(res);
            });
            it('should modify the method map with new commands', async function () {
                const driver = await (0, webdriverio_1.remote)(wdOpts);
                const { sessionId } = driver;
                try {
                    await axios_1.default.post(`${testServerBaseSessionUrl}/${sessionId}/fake_data`, {
                        data: { fake: 'data' },
                    });
                    (0, chai_1.expect)((await axios_1.default.get(`${testServerBaseSessionUrl}/${sessionId}/fake_data`)).data.value).to.eql({ fake: 'data' });
                }
                finally {
                    await driver.deleteSession();
                }
            });
            it('should handle commands and not call the original', async function () {
                const driver = await (0, webdriverio_1.remote)(wdOpts);
                const { sessionId } = driver;
                try {
                    await (0, chai_1.expect)(driver.getPageSource()).to.eventually.eql(`<Fake>${JSON.stringify([sessionId])}</Fake>`);
                }
                finally {
                    await driver.deleteSession();
                }
            });
            it('should handle commands and call the original if designed', async function () {
                const driver = await (0, webdriverio_1.remote)(wdOpts);
                const { sessionId } = driver;
                try {
                    const el = (await axios_1.default.post(`${testServerBaseSessionUrl}/${sessionId}/element`, {
                        using: 'xpath',
                        value: '//MockWebView',
                    })).data.value;
                    (0, chai_1.expect)(el).to.have.property('fake');
                }
                finally {
                    await driver.deleteSession();
                }
            });
            it('should allow original command to be proxied if supported', async function () {
                const driver = await (0, webdriverio_1.remote)(wdOpts);
                const { sessionId } = driver;
                try {
                    await axios_1.default.post(`${testServerBaseSessionUrl}/${sessionId}/context`, {
                        name: 'PROXY',
                    });
                    const handle = (await axios_1.default.get(`${testServerBaseSessionUrl}/${sessionId}/window`)).data
                        .value;
                    (0, chai_1.expect)(handle).to.eql('<<proxied via proxyCommand>>');
                }
                finally {
                    await axios_1.default.post(`${testServerBaseSessionUrl}/${sessionId}/context`, {
                        name: 'NATIVE_APP',
                    });
                    await driver.deleteSession();
                }
            });
            it('should handle unexpected driver shutdown', async function () {
                const newOpts = { ...wdOpts };
                newOpts.capabilities = {
                    ...(newOpts.capabilities ?? {}),
                    'appium:newCommandTimeout': 1,
                };
                const driver = await (0, webdriverio_1.remote)(newOpts);
                let shutdownErr;
                try {
                    let res = await axios_1.default.get(`http://${helpers_1.TEST_HOST}:${port}/unexpected`);
                    (0, chai_1.expect)(res.data).to.not.exist;
                    await (0, asyncbox_1.sleep)(1500);
                    res = await axios_1.default.get(`http://${helpers_1.TEST_HOST}:${port}/unexpected`);
                    (0, chai_1.expect)(res.data).to.match(/Session ended/);
                    (0, chai_1.expect)(res.data).to.match(/timeout/);
                    await driver.deleteSession();
                }
                catch (e) {
                    shutdownErr = e instanceof Error ? e : new Error(String(e));
                }
                (0, chai_1.expect)(shutdownErr).to.exist;
                (0, chai_1.expect)(shutdownErr.message).to.match(/either terminated or not started/);
            });
            it('should allow plugin handled commands to reset newCommandTimeout', async function () {
                const newOpts = { ...wdOpts };
                newOpts.capabilities = {
                    ...(newOpts.capabilities ?? {}),
                    'appium:newCommandTimeout': 2,
                };
                const driver = await (0, webdriverio_1.remote)(newOpts);
                const { sessionId } = driver;
                try {
                    const start = Date.now();
                    for (let i = 0; i < 5; i++) {
                        await (0, asyncbox_1.sleep)(500);
                        await driver.getPageSource();
                    }
                    // prove that we went beyond the new command timeout as a result of sending commands
                    (0, chai_1.expect)(Date.now() - start).to.be.above(2500);
                    await (0, chai_1.expect)(driver.getPageSource()).to.eventually.eql(`<Fake>${JSON.stringify([sessionId])}</Fake>`);
                }
                finally {
                    await driver.deleteSession();
                }
            });
        });
    }
    describe('cli args handling for plugin args', function () {
        let server;
        before(async function () {
            // then start server if we need to
            const args = { ...baseServerArgs, plugin: FAKE_PLUGIN_ARGS };
            server = await (0, main_1.main)(args);
        });
        after(async function () {
            if (server) {
                await server.close();
            }
        });
        it('should receive user cli args for plugin if passed in', async function () {
            const driver = await (0, webdriverio_1.remote)(wdOpts);
            const { sessionId } = driver;
            try {
                const { data } = await axios_1.default.get(`${testServerBaseSessionUrl}/${sessionId}/fakepluginargs`);
                (0, chai_1.expect)(data.value).to.eql(FAKE_ARGS);
            }
            finally {
                await driver.deleteSession();
            }
        });
    });
    describe('cli args handling for empty plugin args', function () {
        let server;
        before(async function () {
            // then start server if we need to
            server = await (0, main_1.main)(baseServerArgs);
        });
        after(async function () {
            if (server) {
                await server.close();
            }
        });
        describe('when no cli args provided by user', function () {
            it('should receive an empty `cliArgs` object', async function () {
                const driver = await (0, webdriverio_1.remote)(wdOpts);
                const { sessionId } = driver;
                try {
                    const { data } = await axios_1.default.get(`${testServerBaseSessionUrl}/${sessionId}/fakepluginargs`);
                    (0, chai_1.expect)(data.value).to.eql({});
                }
                finally {
                    await driver.deleteSession();
                }
            });
        });
    });
    describe('Execute Methods', function () {
        let server;
        let driver;
        before(async function () {
            // then start server if we need to
            const args = {
                appiumHome,
                port,
                address: helpers_1.TEST_HOST,
                usePlugins: ['fake'],
                useDrivers: ['fake'],
            };
            server = await (0, main_1.main)(args);
            driver = await (0, webdriverio_1.remote)(wdOpts);
        });
        after(async function () {
            if (driver) {
                await driver.deleteSession();
            }
            if (server) {
                await server.close();
            }
        });
        it('should handle execute methods using executeMethodMap', async function () {
            const res = await driver.executeScript('fake: plugMeIn', [{ socket: 'electrical' }]);
            (0, chai_1.expect)(res).to.eql('Plugged in to electrical');
        });
        it('should handle execute methods overridden on the driver', async function () {
            const res = await driver.executeScript('fake: getThing', []);
            (0, chai_1.expect)(res).to.eql('PLUGIN_FAKE_THING');
        });
        it('should let driver handle unknown execute methods', async function () {
            const sum = await driver.executeScript('fake: addition', [{ num1: 2, num2: 3 }]);
            (0, chai_1.expect)(sum).to.eql(5);
        });
    });
    describe('BiDi support', function () {
        describe('with a single plugin', function () {
            let driver;
            // this 'after' block needs to come before 'serverSetup' so that the delete session happens
            // before the server shutdown
            after(async function () {
                if (driver) {
                    await driver.deleteSession();
                }
            });
            serverSetup({});
            before(async function () {
                const caps = { ...wdOpts.capabilities, webSocketUrl: true, 'appium:runClock': true };
                driver = await (0, webdriverio_1.remote)({ ...wdOpts, capabilities: caps });
            });
            it('should handle custom bidi commands if registered', async function () {
                let { result } = await driver.send({
                    method: 'appium:fake.getPluginThing',
                    params: {},
                });
                (0, chai_1.expect)(result).to.not.exist;
                await driver.send({
                    method: 'appium:fake.setPluginThing',
                    params: { thing: 'plugin bidi' },
                });
                ({ result } = await driver.send({ method: 'appium:fake.getPluginThing', params: {} }));
                (0, chai_1.expect)(result).to.eql('plugin bidi');
            });
            it('should subscribe and unsubscribe to/from custom bidi events', async function () {
                let retrievals = 0;
                driver.on('appium:fake.pluginThingRetrieved', () => {
                    retrievals++;
                });
                await driver.send({ method: 'appium:fake.getPluginThing', params: {} });
                (0, chai_1.expect)(retrievals).to.eql(0);
                await driver.sessionSubscribe({ events: ['appium:fake.pluginThingRetrieved'] });
                await driver.send({ method: 'appium:fake.getPluginThing', params: {} });
                await driver.send({ method: 'appium:fake.getPluginThing', params: {} });
                (0, chai_1.expect)(retrievals).to.eql(2);
                await driver.sessionUnsubscribe({ events: ['appium:fake.pluginThingRetrieved'] });
                await driver.send({ method: 'appium:fake.getPluginThing', params: {} });
                await driver.send({ method: 'appium:fake.getPluginThing', params: {} });
                (0, chai_1.expect)(retrievals).to.eql(2);
            });
            it('should subscribe and unsubscribe to/from custom bidi events and merge with driver', async function () {
                const collectedEvents = [];
                driver.on('appium:clock.currentTime', (ev) => {
                    collectedEvents.push(ev.time);
                });
                await (0, asyncbox_1.sleep)(750);
                (0, chai_1.expect)(collectedEvents).to.be.empty;
                await driver.sessionSubscribe({ events: ['appium:clock.currentTime'] });
                await (0, asyncbox_1.sleep)(800);
                (0, chai_1.expect)(collectedEvents.length).to.eql(5);
                await driver.sessionUnsubscribe({ events: ['appium:clock.currentTime'] });
                collectedEvents.length = 0;
                await (0, asyncbox_1.sleep)(800);
                (0, chai_1.expect)(collectedEvents).to.be.empty;
            });
            it('should call underlying driver bidi method if next is called', async function () {
                const { result } = await driver.send({
                    method: 'appium:fake.doSomeMath',
                    params: { num1: 2, num2: 3 },
                });
                (0, chai_1.expect)(result).to.eql(11);
            });
            it('should override and not call underlying driver bidi method if next is not called', async function () {
                const { result } = await driver.send({
                    method: 'appium:fake.doSomeMath2',
                    params: { num1: 2, num2: 3 },
                });
                (0, chai_1.expect)(result).to.eql(6);
            });
        });
    });
    describe('IPC Support', function () {
        let driver;
        // this 'after' block needs to come before 'serverSetup' so that the delete session happens
        // before the server shutdown
        after(async function () {
            if (driver) {
                await driver.deleteSession();
            }
        });
        serverSetup({});
        before(async function () {
            const caps = { ...wdOpts.capabilities, webSocketUrl: true, 'appium:runClock': true };
            driver = await (0, webdriverio_1.remote)({ ...wdOpts, capabilities: caps });
        });
        it('should allow driver to publish to plugin', async function () {
            let running = await driver.executeScript('fake: getFakeDriverClockStatus', []);
            (0, chai_1.expect)(running).to.be.true;
            await driver.executeScript('fake: stopClock', []);
            running = await driver.executeScript('fake: getFakeDriverClockStatus', []);
            (0, chai_1.expect)(running).to.be.false;
        });
        it('should allow plugin to publish to driver', async function () {
            let lastMath = await driver.executeScript('fake: getLastPluginMath', []);
            (0, chai_1.expect)(lastMath).to.eql(null);
            const { result } = await driver.send({
                method: 'appium:fake.doSomeMath2',
                params: { num1: 2, num2: 3 },
            });
            (0, chai_1.expect)(result).to.eql(6);
            lastMath = await driver.executeScript('fake: getLastPluginMath', []);
            (0, chai_1.expect)(lastMath.result).to.eql(6);
            (0, chai_1.expect)(lastMath.pluginName).to.have.string('FakePlugin');
        });
    });
});
//# sourceMappingURL=plugin.e2e.spec.js.map