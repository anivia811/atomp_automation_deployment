"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const plugin_test_support_1 = require("@appium/plugin-test-support");
const webdriverio_1 = require("webdriverio");
const execute_child_1 = require("../../lib/execute-child");
const support_1 = require("@appium/support");
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
(0, chai_1.use)(chai_as_promised_1.default);
const THIS_PLUGIN_DIR = support_1.node.getModuleRootSync('@appium/execute-driver-plugin', __filename);
const APPIUM_HOME = node_path_1.default.join(THIS_PLUGIN_DIR, 'local_appium_home');
const FAKE_DRIVER_DIR = node_path_1.default.join(THIS_PLUGIN_DIR, '..', 'fake-driver');
const TEST_HOST = '127.0.0.1';
const TEST_FAKE_APP = node_path_1.default.join(APPIUM_HOME, 'node_modules', '@appium', 'fake-driver', 'test', 'fixtures', 'app.xml');
const TEST_CAPS = {
    platformName: 'Fake',
    'appium:automationName': 'Fake',
    'appium:deviceName': 'Fake',
    'appium:app': TEST_FAKE_APP,
};
const WDIO_OPTS = {
    hostname: TEST_HOST,
    connectionRetryCount: 0,
    capabilities: TEST_CAPS,
};
describe('ExecuteDriverPlugin', function () {
    let driver;
    const basicScript = `return 'foo'`;
    const e2eSetupOpts = {
        host: TEST_HOST,
        driverName: 'fake',
        driverSource: 'local',
        driverSpec: FAKE_DRIVER_DIR,
        pluginName: 'execute-driver',
        pluginSource: 'local',
        pluginSpec: THIS_PLUGIN_DIR,
        appiumHome: APPIUM_HOME,
    };
    after(async function () {
        await support_1.fs.rimraf(APPIUM_HOME);
    });
    describe('without --allow-insecure set', function () {
        let port;
        const { setup, teardown } = (0, plugin_test_support_1.pluginE2EHarness)({ ...e2eSetupOpts });
        before(async function () {
            const { server } = await setup();
            const address = server.address();
            port = address.port;
            driver = await (0, webdriverio_1.remote)({ ...WDIO_OPTS, port });
        });
        after(async function () {
            try {
                await driver?.deleteSession();
            }
            finally {
                await teardown();
            }
        });
        it('should not work unless the allowInsecure feature flag is set', async function () {
            await (0, chai_1.expect)(driver.executeDriverScript(basicScript)).to.eventually.be.rejectedWith(/allow-insecure.+execute_driver_script/i);
        });
    });
    describe('with --allow-insecure set', function () {
        let port;
        const { setup, teardown } = (0, plugin_test_support_1.pluginE2EHarness)({
            ...e2eSetupOpts,
            serverArgs: { allowInsecure: ['*:execute_driver_script'] },
        });
        before(async function () {
            const { server } = await setup();
            const address = server.address();
            port = address.port;
            driver = await (0, webdriverio_1.remote)({ ...WDIO_OPTS, port });
        });
        after(async function () {
            try {
                await driver?.deleteSession();
            }
            finally {
                await teardown();
            }
        });
        it('should execute a webdriverio script in the context of session', async function () {
            const script = `
        const timeouts = await driver.getTimeouts();
        const status = await driver.status();
        return [timeouts, status];
      `;
            const expectedTimeouts = { command: 60000, implicit: 0 };
            const { result, logs } = await driver.executeDriverScript(script);
            (0, chai_1.expect)(result[0]).to.eql(expectedTimeouts);
            (0, chai_1.expect)(result[1].build).to.exist;
            (0, chai_1.expect)(result[1].build.version).to.exist;
            (0, chai_1.expect)(logs).to.eql({ error: [], warn: [], log: [] });
        });
        it('should fail with any script type other than webdriverio currently', async function () {
            const script = `return 'foo'`;
            await (0, chai_1.expect)(driver.executeDriverScript(script, 'wd')).to.eventually.be.rejectedWith(/webdriverio/);
        });
        it('should execute a webdriverio script that returns elements correctly', async function () {
            const script = `
        return await driver.$("#Button1");
      `;
            const { result } = await driver.executeDriverScript(script);
            (0, chai_1.expect)(result).to.eql({
                [execute_child_1.W3C_ELEMENT_KEY]: '1',
                [execute_child_1.MJSONWP_ELEMENT_KEY]: '1',
            });
        });
        it('should execute a webdriverio script that returns elements in deep structure', async function () {
            const script = `
        const el = await driver.$("#Button1");
        return {element: el, elements: [el, el]};
      `;
            const { result } = await driver.executeDriverScript(script);
            const elObj = {
                [execute_child_1.W3C_ELEMENT_KEY]: '1',
                [execute_child_1.MJSONWP_ELEMENT_KEY]: '1',
            };
            (0, chai_1.expect)(result).to.eql({ element: elObj, elements: [elObj, elObj] });
        });
        it('should store and return logs to the user', async function () {
            const script = `
        console.log("foo");
        console.log("foo2");
        console.warn("bar");
        console.error("baz");
        return null;
      `;
            const { logs } = await driver.executeDriverScript(script);
            (0, chai_1.expect)(logs).to.eql({ log: ['foo', 'foo2'], warn: ['bar'], error: ['baz'] });
        });
        it('should have appium specific commands available', async function () {
            const script = `
        return typeof driver.lock;
      `;
            const { result } = await driver.executeDriverScript(script);
            (0, chai_1.expect)(result).to.eql('function');
        });
        it('should correctly handle errors that happen in a webdriverio script', async function () {
            const script = `
        return await driver.$("~notfound");
      `;
            const { result } = await driver.executeDriverScript(script);
            (0, chai_1.expect)(result.error.error).to.equal('no such element');
            (0, chai_1.expect)(result.error.message).to.match(/element could not be located/);
            (0, chai_1.expect)(result.error.stacktrace).to.include('NoSuchElementError:');
            (0, chai_1.expect)(result.selector).to.equal('~notfound');
            (0, chai_1.expect)(result.sessionId).to.equal(driver.sessionId);
        });
        it('should correctly handle errors that happen when a script cannot be compiled', async function () {
            const script = `
        return {;
      `;
            await (0, chai_1.expect)(driver.executeDriverScript(script)).to.eventually.be.rejectedWith(/Could not execute driver script.+Unexpected token/);
        });
        it('should be able to use standard promise and timeout functions in a driver script', async function () {
            const script = `
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return true;
      `;
            await (0, chai_1.expect)(driver.executeDriverScript(script, 'webdriverio', 50)).to.eventually.be.rejectedWith(/.+50.+timeout.+/);
        });
    });
});
//# sourceMappingURL=plugin.e2e.spec.js.map