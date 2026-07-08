"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSessionHelpers = createSessionHelpers;
exports.driverE2ETestSuite = driverE2ETestSuite;
const driver_1 = require("appium/driver");
const axios_1 = __importDefault(require("axios"));
const asyncbox_1 = require("asyncbox");
const helpers_1 = require("./helpers");
const sinon_1 = __importDefault(require("sinon"));
const node_http_1 = require("node:http");
/**
 * Creates some helper functions for E2E tests to manage sessions.
 */
function createSessionHelpers(port, address = helpers_1.TEST_HOST) {
    const createAppiumTestURL = (0, helpers_1.createAppiumURL)(address, port);
    const createSessionURL = (sessionId) => createAppiumTestURL(sessionId, '');
    const newSessionURL = createAppiumTestURL('', 'session');
    return {
        newSessionURL,
        createAppiumTestURL,
        postCommand: async (sessionId, cmdName, data = {}, config = {}) => {
            const url = createAppiumTestURL(sessionId, cmdName);
            const response = await axios_1.default.post(url, data, config);
            return response.data?.value;
        },
        getCommand: async (sessionIdOrCmdName, cmdNameOrConfig, config = {}) => {
            if (typeof cmdNameOrConfig !== 'string') {
                config = cmdNameOrConfig;
                cmdNameOrConfig = sessionIdOrCmdName;
                sessionIdOrCmdName = '';
            }
            const response = await (0, axios_1.default)({
                url: createAppiumTestURL(sessionIdOrCmdName, cmdNameOrConfig),
                validateStatus: null,
                ...config,
            });
            return response.data?.value;
        },
        startSession: async (data, config = {}) => {
            applyNewSessionDefaults(data);
            const response = await axios_1.default.post(newSessionURL, data, config);
            return response.data?.value;
        },
        endSession: async (sessionId) => await axios_1.default.delete(createSessionURL(sessionId), {
            validateStatus: null,
        }),
        getSession: async (sessionId) => {
            const response = await (0, axios_1.default)({
                url: createSessionURL(sessionId),
                validateStatus: null,
            });
            return response.data?.value;
        },
    };
}
/**
 * Creates E2E test suites for a driver.
 */
function driverE2ETestSuite(DriverClass, defaultCaps = {}) {
    const address = defaultCaps['appium:address'] ?? helpers_1.TEST_HOST;
    let port = defaultCaps['appium:port'];
    const className = DriverClass.name || '(unknown driver)';
    describe(`BaseDriver E2E (as ${className})`, function () {
        let baseServer;
        let d;
        let newSessionURL;
        let startSession;
        let getSession;
        let endSession;
        let getCommand;
        let postCommand;
        let expect;
        before(async function () {
            const chai = await import('chai');
            const chaiAsPromised = await import('chai-as-promised');
            chai.use(chaiAsPromised.default);
            expect = chai.expect;
            port = port ?? (await (0, helpers_1.getTestPort)());
            defaultCaps = { ...defaultCaps };
            d = new DriverClass({ port, address });
            baseServer = await (0, driver_1.server)({
                routeConfiguringFunction: (0, driver_1.routeConfiguringFunction)(d),
                port: port,
                hostname: address,
                cliArgs: {},
            });
            const helpers = createSessionHelpers(port, address);
            startSession = helpers.startSession;
            getSession = helpers.getSession;
            endSession = helpers.endSession;
            getCommand = helpers.getCommand;
            postCommand = helpers.postCommand;
            newSessionURL = helpers.newSessionURL;
        });
        after(async function () {
            await baseServer?.close();
        });
        describe('session handling', function () {
            it('should handle idempotency while creating sessions', async function () {
                // TODO: Fix this test for Node 24+
                if (parseInt(process.versions.node.split('.')[0], 10) >= 24) {
                    this.skip();
                }
                // workaround for https://github.com/node-fetch/node-fetch/issues/1735
                const httpAgent = new node_http_1.Agent({ keepAlive: true });
                const sessionIds = [];
                let times = 0;
                do {
                    const { sessionId } = await startSession({
                        capabilities: { alwaysMatch: defaultCaps },
                    }, {
                        headers: {
                            'X-Idempotency-Key': '123456',
                        },
                        httpAgent,
                    });
                    sessionIds.push(sessionId);
                    times++;
                } while (times < 2);
                expect([...new Set(sessionIds)]).to.have.lengthOf(1);
                const { status, data } = await endSession(sessionIds[0]);
                expect(status).to.equal(200);
                expect(data.value).to.be.null;
            });
            it('should handle idempotency while creating parallel sessions', async function () {
                // TODO: Fix this test for Node 24+
                if (parseInt(process.versions.node.split('.')[0], 10) >= 24) {
                    this.skip();
                }
                // workaround for https://github.com/node-fetch/node-fetch/issues/1735
                const httpAgent = new node_http_1.Agent({ keepAlive: true });
                const reqs = [];
                let times = 0;
                do {
                    reqs.push(startSession({
                        capabilities: {
                            alwaysMatch: defaultCaps,
                        },
                    }, {
                        headers: {
                            'X-Idempotency-Key': '12345',
                        },
                        httpAgent,
                    }));
                    times++;
                } while (times < 2);
                const sessionIds = (await Promise.all(reqs)).map((r) => r.sessionId);
                expect([...new Set(sessionIds)]).to.have.lengthOf(1);
                const { status, data } = await endSession(sessionIds[0]);
                expect(status).to.equal(200);
                expect(data.value).to.be.null;
            });
            it('should create session and retrieve a session id, then delete it', async function () {
                let { status, data } = await axios_1.default.post(newSessionURL, {
                    capabilities: {
                        alwaysMatch: defaultCaps,
                    },
                });
                expect(status).to.equal(200);
                expect(data.value.sessionId).to.exist;
                expect(data.value.capabilities.platformName).to.equal(defaultCaps.platformName);
                expect(data.value.capabilities.deviceName).to.equal(defaultCaps['appium:deviceName']);
                ({ status, data } = await endSession(d.sessionId));
                expect(status).to.equal(200);
                expect(data.value).to.be.null;
                expect(d.sessionId).to.be.null;
            });
        });
        describe('command timeouts', function () {
            let originalFindElement;
            let originalFindElements;
            async function startTimeoutSession(timeout) {
                const caps = structuredClone(defaultCaps);
                caps['appium:newCommandTimeout'] = timeout;
                return await startSession({ capabilities: { alwaysMatch: caps } });
            }
            before(function () {
                originalFindElement = d.findElement;
                d.findElement = function () {
                    return 'foo';
                }.bind(d);
                originalFindElements = d.findElements;
                d.findElements = async function () {
                    await (0, asyncbox_1.sleep)(200);
                    return ['foo'];
                }.bind(d);
            });
            after(function () {
                d.findElement = originalFindElement;
                d.findElements = originalFindElements;
            });
            it('should set a default commandTimeout', async function () {
                const newSession = await startTimeoutSession();
                expect(d.newCommandTimeoutMs).to.be.above(0);
                await endSession(newSession.sessionId);
            });
            it('should timeout on commands using commandTimeout cap', async function () {
                const newSession = await startTimeoutSession(0.25);
                const sessionId = d.sessionId;
                await postCommand(sessionId, 'element', {
                    using: 'name',
                    value: 'foo',
                });
                await (0, asyncbox_1.sleep)(400);
                const value = await getSession(sessionId);
                expect(value.error).to.equal('invalid session id');
                expect(d.sessionId).to.be.null;
                const resp = (await endSession(newSession.sessionId)).data.value;
                expect(resp?.error).to.equal('invalid session id');
            });
            it('should not timeout with commandTimeout of false', async function () {
                const newSession = await startTimeoutSession(0.1);
                const start = Date.now();
                const value = await postCommand(d.sessionId, 'elements', {
                    using: 'name',
                    value: 'foo',
                });
                expect(Date.now() - start).to.be.above(150);
                expect(value).to.eql(['foo']);
                await endSession(newSession.sessionId);
            });
            it('should not timeout with commandTimeout of 0', async function () {
                d.newCommandTimeoutMs = 2;
                const newSession = await startTimeoutSession(0);
                await postCommand(d.sessionId, 'element', {
                    using: 'name',
                    value: 'foo',
                });
                await (0, asyncbox_1.sleep)(400);
                const value = await getSession(d.sessionId);
                expect(value.platformName).to.equal(defaultCaps.platformName);
                const resp = (await endSession(newSession.sessionId)).data.value;
                expect(resp).to.be.null;
                d.newCommandTimeoutMs = 60 * 1000;
            });
            it('should not timeout if its just the command taking awhile', async function () {
                const newSession = await startTimeoutSession(0.25);
                const { sessionId } = d;
                await postCommand(d.sessionId, 'element', {
                    using: 'name',
                    value: 'foo',
                });
                await (0, asyncbox_1.sleep)(400);
                const value = await getSession(sessionId);
                expect(value.error).to.equal('invalid session id');
                expect(d.sessionId).to.be.null;
                const resp = (await endSession(newSession.sessionId)).data.value;
                expect(resp?.error).to.equal('invalid session id');
            });
            it('should not have a timer running before or after a session', async function () {
                expect(d.noCommandTimer).to.be.null;
                const newSession = await startTimeoutSession(0.25);
                expect(newSession.sessionId).to.equal(d.sessionId);
                expect(d.noCommandTimer).to.exist;
                await endSession(newSession.sessionId);
                expect(d.noCommandTimer).to.be.null;
            });
        });
        describe('settings api', function () {
            before(function () {
                d.settings = new driver_1.DeviceSettings({ ignoreUnimportantViews: false });
            });
            it('should be able to get settings object', function () {
                expect(d.settings.getSettings().ignoreUnimportantViews).to.be.false;
            });
            it('should not reject when `updateSettings` method is not provided', async function () {
                await expect(d.settings.update({ ignoreUnimportantViews: true })).to.not.be.rejected;
            });
            it('should reject for invalid update object', async function () {
                await expect(d.settings.update('invalid json')).to.be.rejectedWith('JSON');
            });
        });
        describe('unexpected exits', function () {
            let sandbox;
            beforeEach(function () {
                sandbox = sinon_1.default.createSandbox();
            });
            afterEach(function () {
                sandbox.restore();
            });
            it('should reject a current command when the driver crashes', async function () {
                sandbox.stub(d, 'getStatus').callsFake(async function () {
                    await (0, asyncbox_1.sleep)(5000);
                });
                const reqPromise = getCommand('status', { validateStatus: null });
                await (0, asyncbox_1.sleep)(100);
                const shutdownEventPromise = new Promise((resolve, reject) => {
                    setTimeout(() => reject(new Error('onUnexpectedShutdown event is expected to be fired within 5 seconds timeout')), 5000);
                    d.onUnexpectedShutdown(resolve);
                });
                void d.startUnexpectedShutdown(new Error('Crashytimes'));
                const value = await reqPromise;
                expect(value.message).to.contain('Crashytimes');
                await shutdownEventPromise;
            });
        });
        describe('event timings', function () {
            let session;
            let res;
            describe('when not provided the eventTimings cap', function () {
                before(async function () {
                    session = await startSession({ capabilities: { alwaysMatch: defaultCaps } });
                    res = await getSession(session.sessionId);
                });
                after(async function () {
                    if (session) {
                        await endSession(session.sessionId);
                    }
                });
                it('should not respond with events', function () {
                    expect(res.events).to.be.undefined;
                });
            });
            describe('when provided the eventTimings cap', function () {
                before(async function () {
                    session = await startSession({
                        capabilities: { alwaysMatch: { ...defaultCaps, 'appium:eventTimings': true } },
                    });
                    res = await getSession(session.sessionId);
                });
                after(async function () {
                    if (session) {
                        await endSession(session.sessionId);
                    }
                });
                it('should add a newSessionRequested event', function () {
                    expect(res.events?.newSessionRequested?.[0]).to.be.a('number');
                });
                it('should add a newSessionStarted event', function () {
                    expect(res.events?.newSessionRequested?.[0]).to.be.a('number');
                });
            });
        });
    });
}
function applyNewSessionDefaults(data) {
    data.capabilities ??= { alwaysMatch: {}, firstMatch: [{}] };
    data.capabilities.alwaysMatch ??= {};
    data.capabilities.firstMatch ??= [{}];
}
//# sourceMappingURL=e2e-suite.js.map