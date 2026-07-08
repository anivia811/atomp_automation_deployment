"use strict";
// @ts-check
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../lib/constants");
const base_driver_1 = require("@appium/base-driver");
const fake_driver_1 = require("@appium/fake-driver");
const asyncbox_1 = require("asyncbox");
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const sinon_1 = require("sinon");
const schema_1 = require("../../lib/schema/schema");
const capability_1 = require("../../lib/helpers/capability");
const buildInfoModule = __importStar(require("../../lib/helpers/build"));
const helpers_1 = require("../helpers");
const base_plugin_1 = require("@appium/base-plugin");
const { expect } = chai_1.default;
chai_1.default.use(chai_as_promised_1.default);
const SESSION_ID = '1';
const SESSION_DISCOVERY_ENABLED = { allowInsecure: [`*:${constants_1.SESSION_DISCOVERY_FEATURE}`] };
/**
 * Fills the umbrella driver's plugin map without replacing the readonly `pluginClasses` reference.
 */
function setPluginClassesForTest(appium, classes) {
    appium.pluginClasses.clear();
    for (const [cls, name] of classes) {
        appium.pluginClasses.set(cls, name);
    }
}
describe('AppiumDriver', function () {
    let sandbox;
    let AppiumDriver;
    let MockConfig;
    beforeEach(async function () {
        sandbox = (0, sinon_1.createSandbox)();
        (0, schema_1.resetSchema)();
        await (0, schema_1.finalizeSchema)();
        MockConfig = {
            getBuildInfo: sandbox
                .stub()
                .callsFake(() => ({ version: MockConfig.APPIUM_VER })),
            updateBuildInfo: sandbox.stub().resolves(),
            APPIUM_VER: '2.0',
        };
        ({ AppiumDriver } = helpers_1.rewiremock.proxy(() => require('../../lib/appium'), {
            '../../lib/helpers/build': {
                ...buildInfoModule,
                getBuildInfo: MockConfig.getBuildInfo,
                updateBuildInfo: MockConfig.updateBuildInfo,
                APPIUM_VER: MockConfig.APPIUM_VER,
            },
        }));
    });
    afterEach(function () {
        sandbox.restore();
    });
    describe('constructor', function () {
        it('should not emit an uncaught rejection if updateBuildInfo() fails', async function () {
            const err = new Error('oops');
            // this test is wacky because we do not await the call to `updateBuildInfo()` within
            // the constructor. in that case, we won't actually know _when_ the promise is resolved or rejected.
            // the following is the workaround
            const promise = new Promise((resolve) => {
                MockConfig.updateBuildInfo.callsFake(() => {
                    resolve();
                    return Promise.reject(err);
                });
            });
            const ad = new AppiumDriver({});
            // triggers the `log` getter to set `_log`
            ad.log;
            // now we can stub `_log`, since it exists
            const debugStrub = sandbox.stub(ad._log, 'debug');
            // finally, wait for `updateBuildInfo()` to finish up
            await promise;
            expect(debugStrub.calledOnce).to.be.true;
        });
    });
    describe('instance method', function () {
        let fakeDriver;
        function getDriverAndFakeDriver(appiumArgs = {}, DriverClass = fake_driver_1.FakeDriver) {
            const appium = new AppiumDriver(appiumArgs);
            fakeDriver = new DriverClass();
            const mockFakeDriver = sandbox.mock(fakeDriver);
            const mockedDriverReturnerClass = function Driver() {
                return fakeDriver;
            };
            // stub does not satisfy DriverConfig typing
            appium.driverConfig = {
                findMatchingDriver: sandbox.stub().returns({
                    driver: mockedDriverReturnerClass,
                    version: '1.2.3',
                    driverName: 'fake',
                }),
            };
            return [appium, mockFakeDriver];
        }
        describe('configureGlobalFeatures', function () {
            let appium;
            function createDriver(cliArgs) {
                appium = new AppiumDriver(cliArgs);
                appium.configureGlobalFeatures();
            }
            it('should not allow insecure features by default', function () {
                createDriver({});
                expect(appium.allowInsecure).to.be.empty;
                expect(appium.denyInsecure).to.be.empty;
                expect(appium.relaxedSecurityEnabled).to.be.false;
            });
            it('should allow insecure features', function () {
                createDriver({ allowInsecure: ['foo:bar'] });
                expect(appium.allowInsecure).to.eql(['foo:bar']);
            });
            it('should deny insecure features', function () {
                createDriver({ denyInsecure: ['foo:baz'] });
                expect(appium.denyInsecure).to.eql(['foo:baz']);
            });
            it('should allow relaxed security', function () {
                createDriver({ relaxedSecurityEnabled: true });
                expect(appium.relaxedSecurityEnabled).to.be.true;
            });
            it('should ignore allowed features in combination with relaxed security', function () {
                createDriver({
                    allowInsecure: ['foo:bar'],
                    relaxedSecurityEnabled: true,
                });
                expect(appium.allowInsecure).to.be.empty;
                expect(appium.relaxedSecurityEnabled).to.be.true;
            });
        });
        describe('createSession', function () {
            let appium;
            let mockFakeDriver;
            beforeEach(function () {
                [appium, mockFakeDriver] = getDriverAndFakeDriver(SESSION_DISCOVERY_ENABLED);
            });
            afterEach(async function () {
                mockFakeDriver.restore();
                await appium.deleteSession(SESSION_ID);
            });
            it(`should call inner driver's createSession with desired capabilities`, async function () {
                mockFakeDriver
                    .expects('createSession')
                    .once()
                    .withExactArgs(helpers_1.W3C_CAPS, helpers_1.W3C_CAPS, helpers_1.W3C_CAPS, [])
                    .returns([
                    SESSION_ID,
                    (0, capability_1.removeAppiumPrefixes)(helpers_1.W3C_PREFIXED_CAPS),
                ]);
                await appium.createSession(helpers_1.W3C_CAPS);
                mockFakeDriver.verify();
            });
            it(`should call inner driver's createSession with desired and default capabilities`, async function () {
                const defaultCaps = { 'appium:someCap': 'hello' };
                const allCaps = {
                    ...helpers_1.W3C_CAPS,
                    alwaysMatch: { ...helpers_1.W3C_CAPS.alwaysMatch, ...defaultCaps },
                };
                appium.args.defaultCapabilities = defaultCaps;
                mockFakeDriver
                    .expects('createSession')
                    .once()
                    .withArgs(allCaps, allCaps, allCaps)
                    .returns([
                    SESSION_ID,
                    (0, capability_1.removeAppiumPrefixes)(allCaps.alwaysMatch),
                ]);
                await appium.createSession(helpers_1.W3C_CAPS, helpers_1.W3C_CAPS, helpers_1.W3C_CAPS);
                mockFakeDriver.verify();
            });
            it(`should call inner driver's createSession with desired and default capabilities without overriding caps`, async function () {
                // a default capability with the same key as a desired capability
                // should do nothing
                const defaultCaps = { platformName: 'Ersatz' };
                appium.args.defaultCapabilities = defaultCaps;
                mockFakeDriver
                    .expects('createSession')
                    .once()
                    .withArgs(helpers_1.W3C_CAPS, helpers_1.W3C_CAPS, helpers_1.W3C_CAPS)
                    .returns([
                    SESSION_ID,
                    (0, capability_1.removeAppiumPrefixes)(helpers_1.W3C_PREFIXED_CAPS),
                ]);
                await appium.createSession(helpers_1.W3C_CAPS, helpers_1.W3C_CAPS, helpers_1.W3C_CAPS);
                mockFakeDriver.verify();
            });
            it('should kill all other sessions if sessionOverride is on', async function () {
                appium.configureGlobalFeatures();
                appium.args.sessionOverride = true;
                // mock three sessions that should be removed when the new one is created
                const fakeDrivers = [new fake_driver_1.FakeDriver(), new fake_driver_1.FakeDriver(), new fake_driver_1.FakeDriver()];
                const mockFakeDrivers = fakeDrivers.map((fd) => sandbox.mock(fd));
                mockFakeDrivers[0].expects('deleteSession').once();
                mockFakeDrivers[1]
                    .expects('deleteSession')
                    .once()
                    .throws('Cannot shut down Android driver; it has already shut down');
                mockFakeDrivers[2].expects('deleteSession').once();
                appium.sessions['abc-123-xyz'] = fakeDrivers[0];
                appium.sessions['xyz-321-abc'] = fakeDrivers[1];
                appium.sessions['123-abc-xyz'] = fakeDrivers[2];
                let sessions = await appium.getAppiumSessions();
                expect(sessions).to.have.length(3);
                mockFakeDriver
                    .expects('createSession')
                    .once()
                    .withExactArgs(helpers_1.W3C_CAPS, helpers_1.W3C_CAPS, helpers_1.W3C_CAPS, [])
                    .returns([
                    SESSION_ID,
                    (0, capability_1.removeAppiumPrefixes)(helpers_1.W3C_PREFIXED_CAPS),
                ]);
                await appium.createSession(helpers_1.W3C_CAPS, helpers_1.W3C_CAPS, helpers_1.W3C_CAPS);
                sessions = await appium.getAppiumSessions();
                expect(sessions).to.have.length(1);
                for (const mfd of mockFakeDrivers) {
                    mfd.verify();
                }
                mockFakeDriver.verify();
            });
            it('should call "createSession" with W3C capabilities argument, if provided', async function () {
                mockFakeDriver
                    .expects('createSession')
                    .once()
                    .withArgs(helpers_1.W3C_CAPS, helpers_1.W3C_CAPS, helpers_1.W3C_CAPS)
                    .returns([SESSION_ID, helpers_1.BASE_CAPS]);
                await appium.createSession(helpers_1.W3C_CAPS, helpers_1.W3C_CAPS, helpers_1.W3C_CAPS);
                mockFakeDriver.verify();
            });
            it('should call "createSession" with W3C capabilities argument with additional provided parameters', async function () {
                const w3cCaps = {
                    ...helpers_1.W3C_CAPS,
                    alwaysMatch: {
                        ...helpers_1.W3C_CAPS.alwaysMatch,
                        'appium:someOtherParm': 'someOtherParm',
                    },
                };
                const expectedCaps = {
                    alwaysMatch: {
                        ...w3cCaps.alwaysMatch,
                        'appium:someOtherParm': 'someOtherParm',
                    },
                    firstMatch: [{}],
                };
                mockFakeDriver
                    .expects('createSession')
                    .once()
                    .withArgs(expectedCaps, expectedCaps, expectedCaps)
                    .returns([SESSION_ID, (0, capability_1.insertAppiumPrefixes)(helpers_1.BASE_CAPS)]);
                await appium.createSession(w3cCaps, w3cCaps, w3cCaps);
                mockFakeDriver.verify();
            });
            it('should assign args to property `cliArgs`', async function () {
                class ArgsDriver extends base_driver_1.BaseDriver {
                }
                const args = { driver: { fake: { randomArg: 1234 } } };
                [appium, mockFakeDriver] = getDriverAndFakeDriver(args, ArgsDriver);
                const { value } = await appium.createSession(helpers_1.W3C_CAPS, helpers_1.W3C_CAPS, helpers_1.W3C_CAPS);
                try {
                    expect(fakeDriver.cliArgs).to.eql({ randomArg: 1234 });
                }
                finally {
                    await appium.deleteSession(value[0]);
                }
            });
        });
        describe('deleteSession', function () {
            let appium;
            let mockFakeDriver;
            beforeEach(function () {
                [appium, mockFakeDriver] = getDriverAndFakeDriver(SESSION_DISCOVERY_ENABLED);
            });
            afterEach(function () {
                mockFakeDriver.restore();
            });
            it('should remove the session if it is found', async function () {
                appium.configureGlobalFeatures();
                const [sessionId] = (await appium.createSession(null, null, helpers_1.W3C_CAPS)).value;
                let sessions = await appium.getAppiumSessions();
                expect(sessions).to.have.length(1);
                await appium.deleteSession(sessionId);
                sessions = await appium.getAppiumSessions();
                expect(sessions).to.have.length(0);
            });
            it("should call inner driver's deleteSession method", async function () {
                const [sessionId] = (await appium.createSession(null, null, helpers_1.W3C_CAPS)).value;
                mockFakeDriver
                    .expects('deleteSession')
                    .once()
                    .withExactArgs(sessionId, [])
                    .returns(undefined);
                await appium.deleteSession(sessionId);
                mockFakeDriver.verify();
                // cleanup, since we faked the delete session call
                await mockFakeDriver.object.deleteSession();
            });
        });
        describe('configureDriverFeatures', function () {
            let appium;
            async function getDriverInstance(appiumArgs) {
                appium = new AppiumDriver(appiumArgs);
                appium.configureGlobalFeatures();
                const fakeDriver = new fake_driver_1.FakeDriver();
                const mockFakeDriver = sandbox.mock(fakeDriver);
                const mockedDriverReturnerClass = function Driver() {
                    return fakeDriver;
                };
                // stub does not satisfy DriverConfig typing
                appium.driverConfig = {
                    findMatchingDriver: sandbox.stub().returns({
                        driver: mockedDriverReturnerClass,
                        version: '1.2.3',
                        driverName: 'fake',
                    }),
                };
                mockFakeDriver
                    .expects('createSession')
                    .once()
                    .withExactArgs(undefined, null, helpers_1.W3C_CAPS, [])
                    .returns([
                    SESSION_ID,
                    (0, capability_1.removeAppiumPrefixes)(helpers_1.W3C_PREFIXED_CAPS),
                ]);
                await appium.createSession(undefined, null, helpers_1.W3C_CAPS);
                return fakeDriver;
            }
            afterEach(async function () {
                await appium.deleteSession(SESSION_ID);
            });
            it(`should not apply any insecure features by default`, async function () {
                fakeDriver = await getDriverInstance({});
                expect(fakeDriver.allowInsecure).to.be.empty;
                expect(fakeDriver.denyInsecure).to.be.empty;
                expect(fakeDriver.relaxedSecurityEnabled).to.be.false;
            });
            it(`should apply relaxed security`, async function () {
                fakeDriver = await getDriverInstance({ relaxedSecurityEnabled: true });
                expect(fakeDriver.relaxedSecurityEnabled).to.be.true;
            });
            it(`should apply global-scope insecure features`, async function () {
                fakeDriver = await getDriverInstance({
                    allowInsecure: ['*:foo'],
                    denyInsecure: ['*:bar'],
                });
                expect(fakeDriver.allowInsecure).to.eql(['*:foo']);
                expect(fakeDriver.denyInsecure).to.eql(['*:bar']);
            });
            it(`should apply driver-scope insecure features only if the driver name matches`, async function () {
                fakeDriver = await getDriverInstance({ allowInsecure: ['fake:foo', 'real:bar'] });
                expect(fakeDriver.allowInsecure).to.eql(['fake:foo']);
            });
        });
        describe('getAppiumSessions', function () {
            let appium;
            let mockFakeDriver;
            let sessions;
            before(function () {
                [appium, mockFakeDriver] = getDriverAndFakeDriver(SESSION_DISCOVERY_ENABLED);
                appium.configureGlobalFeatures();
            });
            afterEach(async function () {
                for (const session of sessions) {
                    await appium.deleteSession(session.id);
                }
                mockFakeDriver.restore();
            });
            it('should return an empty array of sessions', async function () {
                sessions = await appium.getAppiumSessions();
                expect(sessions).to.be.an('array');
                expect(sessions).to.be.empty;
            });
            it('should return sessions created', async function () {
                const caps1 = {
                    alwaysMatch: { ...helpers_1.W3C_PREFIXED_CAPS, 'appium:cap': 'value' },
                };
                const caps2 = {
                    alwaysMatch: { ...helpers_1.W3C_PREFIXED_CAPS, 'appium:cap': 'other value' },
                };
                mockFakeDriver
                    .expects('createSession')
                    .once()
                    .returns([
                    'fake-session-id-1',
                    (0, capability_1.removeAppiumPrefixes)(caps1.alwaysMatch),
                ]);
                const [session1Id, session1Caps] = (await appium.createSession(null, null, caps1)).value;
                mockFakeDriver
                    .expects('createSession')
                    .once()
                    .returns([
                    'fake-session-id-2',
                    (0, capability_1.removeAppiumPrefixes)(caps2.alwaysMatch),
                ]);
                const [session2Id, session2Caps] = (await appium.createSession(null, null, caps2)).value;
                sessions = await appium.getAppiumSessions();
                expect(sessions).to.be.an('array');
                expect(sessions).to.have.length(2);
                expect(sessions[0].id).to.equal(session1Id);
                expect(sessions[0]).to.have.property('created');
                expect((0, capability_1.removeAppiumPrefixes)(caps1.alwaysMatch)).to.eql(session1Caps);
                expect(sessions[1].id).to.equal(session2Id);
                expect(sessions[1]).to.have.property('created');
                expect((0, capability_1.removeAppiumPrefixes)(caps2.alwaysMatch)).to.eql(session2Caps);
            });
        });
        describe('getStatus', function () {
            let appium;
            before(function () {
                appium = new AppiumDriver({});
            });
            it('should return a status', async function () {
                const status = await appium.getStatus();
                expect(status.build).to.exist;
                expect(status.build.version).to.exist;
            });
        });
        describe('sessionExists', function () { });
        describe('attachUnexpectedShutdownHandler', function () {
            let appium;
            let mockFakeDriver;
            beforeEach(function () {
                [appium, mockFakeDriver] = getDriverAndFakeDriver();
            });
            afterEach(async function () {
                await mockFakeDriver.object.deleteSession();
                mockFakeDriver.restore();
                appium.args.defaultCapabilities = {};
            });
            it('should remove session if inner driver unexpectedly exits with an error', async function () {
                const [sessionId] = (await appium.createSession(null, null, structuredClone(helpers_1.W3C_CAPS))).value;
                expect(Object.keys(appium.sessions)).to.contain(sessionId);
                appium.sessions[sessionId].eventEmitter.emit('onUnexpectedShutdown', new Error('Oops'));
                // let event loop spin so rejection is handled
                await (0, asyncbox_1.sleep)(1);
                expect(Object.keys(appium.sessions)).to.not.contain(sessionId);
            });
            it('should remove session if inner driver unexpectedly exits with no error', async function () {
                const [sessionId] = (await appium.createSession(null, null, structuredClone(helpers_1.W3C_CAPS))).value;
                expect(Object.keys(appium.sessions)).to.contain(sessionId);
                appium.sessions[sessionId].eventEmitter.emit('onUnexpectedShutdown');
                // let event loop spin so rejection is handled
                await (0, asyncbox_1.sleep)(1);
                expect(Object.keys(appium.sessions)).to.not.contain(sessionId);
            });
        });
        describe('createPluginInstances', function () {
            class NoArgsPlugin extends base_plugin_1.BasePlugin {
            }
            NoArgsPlugin.baseVersion = '1.0';
            class ArgsPlugin extends base_plugin_1.BasePlugin {
            }
            ArgsPlugin.baseVersion = '1.0';
            class ArrayArgPlugin extends base_plugin_1.BasePlugin {
            }
            ArrayArgPlugin.baseVersion = '1.0';
            beforeEach(async function () {
                (0, schema_1.resetSchema)();
                // to establish defaults, we need to register a schema for the plugin.
                // note that the `noargs` plugin does not need a schema, because it
                // accepts no arguments.
                await (0, schema_1.registerSchema)(constants_1.PLUGIN_TYPE, 'args', {
                    type: 'object',
                    properties: {
                        randomArg: {
                            type: 'number',
                            default: 2000,
                        },
                    },
                });
                await (0, schema_1.registerSchema)(constants_1.PLUGIN_TYPE, 'arrayarg', {
                    type: 'object',
                    properties: {
                        arr: {
                            type: 'array',
                            default: [],
                        },
                    },
                });
                await (0, schema_1.finalizeSchema)();
            });
            describe('when args are not present', function () {
                it('the `cliArgs` prop should be an empty object', function () {
                    const appium = new AppiumDriver({});
                    setPluginClassesForTest(appium, new Map([
                        [NoArgsPlugin, 'noargs'],
                        [ArgsPlugin, 'args'],
                    ]));
                    for (const plugin of appium.createPluginInstances()) {
                        expect(plugin.cliArgs).to.eql({});
                    }
                });
            });
            describe('when args are equal to the schema defaults', function () {
                it('the `cliArgs` prop should contain the schema defaults', function () {
                    const appium = new AppiumDriver({ plugin: { args: { randomArg: 2000 } } });
                    setPluginClassesForTest(appium, new Map([
                        [NoArgsPlugin, 'noargs'],
                        [ArgsPlugin, 'args'],
                    ]));
                    const [noargs, args] = appium.createPluginInstances();
                    expect(noargs.cliArgs).to.eql({});
                    expect(args.cliArgs).to.eql({ randomArg: 2000 });
                });
                describe('when the default is an "object"', function () {
                    it('the `cliArgs` prop should contain the schema defaults', function () {
                        const appium = new AppiumDriver({ plugin: { arrayarg: { arr: [] } } });
                        setPluginClassesForTest(appium, new Map([
                            [NoArgsPlugin, 'noargs'],
                            [ArgsPlugin, 'args'],
                            [ArrayArgPlugin, 'arrayarg'],
                        ]));
                        const [noargs, args, arrayarg] = appium.createPluginInstances();
                        expect(noargs.cliArgs).to.eql({});
                        expect(args.cliArgs).to.eql({});
                        expect(arrayarg.cliArgs).to.eql({ arr: [] });
                    });
                });
            });
            describe('when args are not equal to the schema defaults', function () {
                it('should add cliArgs to the plugin', function () {
                    const appium = new AppiumDriver({ plugin: { args: { randomArg: 1234 } } });
                    setPluginClassesForTest(appium, new Map([[ArgsPlugin, 'args']]));
                    const plugin = appium.createPluginInstances()[0];
                    expect(plugin.cliArgs).to.eql({ randomArg: 1234 });
                });
            });
        });
        describe('pluginsForSession', function () {
            it('should cache plugin instances per existing session', function () {
                const appium = new AppiumDriver({});
                const fakeDriver = new fake_driver_1.FakeDriver();
                appium.sessions[SESSION_ID] = fakeDriver;
                const createPluginInstancesSpy = sandbox.spy(appium, 'createPluginInstances');
                const firstPlugins = appium.pluginsForSession(SESSION_ID);
                const secondPlugins = appium.pluginsForSession(SESSION_ID);
                expect(firstPlugins).to.equal(secondPlugins);
                expect(appium.sessionPlugins[SESSION_ID]).to.equal(firstPlugins);
                expect(createPluginInstancesSpy.calledOnce).to.be.true;
            });
        });
    });
});
//# sourceMappingURL=appiumdriver.spec.js.map