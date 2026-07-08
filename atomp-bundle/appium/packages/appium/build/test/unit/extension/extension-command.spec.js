"use strict";
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
const driver_config_1 = require("../../../lib/extension/driver-config");
const extension_command_1 = require("../../../lib/cli/extension-command");
const sinon_1 = __importDefault(require("sinon"));
const sinon_chai_1 = __importDefault(require("sinon-chai"));
const helpers_1 = require("../../helpers");
const manifest_1 = require("../../../lib/extension/manifest");
const support_1 = require("@appium/support");
const utils_1 = require("../../../lib/utils");
const chai_1 = require("chai");
const chai = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
/**
 * Relative path from actual `package.json` of `FakeDriver` for the `fake-stdin` script
 */
const FAKE_STDIN_SCRIPT = require(`${helpers_1.FAKE_DRIVER_DIR}/package.json`).appium.scripts['fake-stdin'];
let sandbox;
chai.use(chai_as_promised_1.default);
chai.use(sinon_chai_1.default);
describe('ExtensionCommand', function () {
    const asExtensionConfig = (value) => value;
    describe('method', function () {
        let ec;
        class TestExtensionCommand extends extension_command_1.ExtensionCommand {
            getPostInstallText() {
                return '';
            }
            validateExtensionFields() { }
        }
        beforeEach(function () {
            sandbox = sinon_1.default.createSandbox();
            const driverConfig = driver_config_1.DriverConfig.create(sandbox.createStubInstance(manifest_1.Manifest));
            ec = new TestExtensionCommand({ config: driverConfig, json: false });
        });
        afterEach(function () {
            sandbox.verify();
            sandbox.restore();
        });
        describe('_runUnbuffered()', function () {
            // this test is low value and mostly just asserts that `child_process.spawn()` works.
            // the problem is that because `_run()` returns a `Promise`, a caller cannot reach the
            // underlying `ChildProcess` instance.
            // something like `execa` could work around this because it returns a frankenstein of a
            // `Promise` + `ChildProcess`, but I didn't want to add the dep.
            it('should respond to stdin', function (done) {
                // we have to fake writing to STDIN because this is an automated test, after all.
                const proc = ec._runUnbuffered(helpers_1.FAKE_DRIVER_DIR, FAKE_STDIN_SCRIPT, [], {
                    stdio: ['pipe', 'inherit', 'inherit'],
                });
                proc.once('exit', (code) => {
                    try {
                        (0, chai_1.expect)(code).to.equal(0);
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                });
                setTimeout(() => {
                    // TS does not understand that `proc.stdin` is not `null`, because it is only a `Writable`
                    // if STDIN is piped from the parent.
                    const stdin = proc.stdin;
                    stdin.write('\n');
                    stdin.end();
                }, 200);
            });
        });
    });
    describe('injectAppiumSymlinks', function () {
        let fsExistsStub;
        let fsSymlinkStub;
        let isWindowsStub;
        let logger;
        beforeEach(function () {
            sandbox = sinon_1.default.createSandbox();
            fsExistsStub = sandbox.stub(support_1.fs, 'exists');
            fsSymlinkStub = sandbox.stub(support_1.fs, 'symlink');
            isWindowsStub = sandbox.stub(support_1.system, 'isWindows');
            logger = {
                info: sandbox.stub(),
                warn: sandbox.stub(),
                error: sandbox.stub(),
                debug: sandbox.stub(),
            };
            isWindowsStub.returns(false);
        });
        afterEach(function () {
            sandbox.verify();
            sandbox.restore();
        });
        describe('when there are no installed extensions', function () {
            it('should not create any symlinks', async function () {
                const driverConfig = { installedExtensions: {} };
                const pluginConfig = { installedExtensions: {} };
                await (0, extension_command_1.injectAppiumSymlinks)(asExtensionConfig(driverConfig), asExtensionConfig(pluginConfig), logger);
                (0, chai_1.expect)(fsSymlinkStub).to.not.have.been.called;
            });
        });
        describe('when there are npm-installed drivers', function () {
            it('should create symlinks for npm-installed drivers', async function () {
                const driverConfig = {
                    installedExtensions: {
                        'driver-for-test': {
                            installType: 'npm',
                            installPath: '/path/to/driver-for-test',
                        },
                    },
                };
                const pluginConfig = { installedExtensions: {} };
                fsExistsStub.withArgs('/path/to/driver-for-test/node_modules').resolves(true);
                fsExistsStub.withArgs('/path/to/driver-for-test/node_modules/appium').resolves(false);
                await (0, extension_command_1.injectAppiumSymlinks)(asExtensionConfig(driverConfig), asExtensionConfig(pluginConfig), logger);
                (0, chai_1.expect)(fsExistsStub).to.have.been.calledWith('/path/to/driver-for-test/node_modules');
                (0, chai_1.expect)(fsExistsStub).to.have.been.calledWith('/path/to/driver-for-test/node_modules/appium');
                (0, chai_1.expect)(fsSymlinkStub).to.have.been.calledOnce;
                (0, chai_1.expect)(fsSymlinkStub).to.have.been.calledWith(utils_1.appiumPackageRoot, '/path/to/driver-for-test/node_modules/appium', 'dir');
            });
            it('should create junction symlinks on Windows', async function () {
                isWindowsStub.returns(true);
                const driverConfig = {
                    installedExtensions: {
                        'driver-for-test': {
                            installType: 'npm',
                            installPath: '/path/to/driver-for-test',
                        },
                    },
                };
                const pluginConfig = { installedExtensions: {} };
                fsExistsStub.withArgs('/path/to/driver-for-test/node_modules').resolves(true);
                fsExistsStub.withArgs('/path/to/driver-for-test/node_modules/appium').resolves(false);
                await (0, extension_command_1.injectAppiumSymlinks)(asExtensionConfig(driverConfig), asExtensionConfig(pluginConfig), logger);
                (0, chai_1.expect)(fsSymlinkStub).to.have.been.calledWith(utils_1.appiumPackageRoot, '/path/to/driver-for-test/node_modules/appium', 'junction');
            });
            it('should not create symlinks if node_modules directory does not exist', async function () {
                const driverConfig = {
                    installedExtensions: {
                        'driver-for-test': {
                            installType: 'npm',
                            installPath: '/path/to/driver-for-test',
                        },
                    },
                };
                const pluginConfig = { installedExtensions: {} };
                fsExistsStub.withArgs('/path/to/driver-for-test/node_modules').resolves(false);
                await (0, extension_command_1.injectAppiumSymlinks)(asExtensionConfig(driverConfig), asExtensionConfig(pluginConfig), logger);
                (0, chai_1.expect)(fsSymlinkStub).to.not.have.been.called;
            });
            it('should not create symlinks if symlink already exists', async function () {
                const driverConfig = {
                    installedExtensions: {
                        'driver-for-test': {
                            installType: 'npm',
                            installPath: '/path/to/driver-for-test',
                        },
                    },
                };
                const pluginConfig = { installedExtensions: {} };
                fsExistsStub.resolves(true);
                await (0, extension_command_1.injectAppiumSymlinks)(asExtensionConfig(driverConfig), asExtensionConfig(pluginConfig), logger);
                (0, chai_1.expect)(fsSymlinkStub).to.not.have.been.called;
            });
        });
        describe('when there are npm-installed plugins', function () {
            it('should create symlinks for npm-installed plugins', async function () {
                const driverConfig = { installedExtensions: {} };
                const pluginConfig = {
                    installedExtensions: {
                        'plugin-for-test': {
                            installType: 'npm',
                            installPath: '/path/to/plugin-for-test',
                        },
                    },
                };
                fsExistsStub.withArgs('/path/to/plugin-for-test/node_modules').resolves(true);
                fsExistsStub.withArgs('/path/to/plugin-for-test/node_modules/appium').resolves(false);
                await (0, extension_command_1.injectAppiumSymlinks)(asExtensionConfig(driverConfig), asExtensionConfig(pluginConfig), logger);
                (0, chai_1.expect)(fsSymlinkStub).to.have.been.calledOnce;
                (0, chai_1.expect)(fsSymlinkStub).to.have.been.calledWith(utils_1.appiumPackageRoot, '/path/to/plugin-for-test/node_modules/appium', 'dir');
            });
        });
        describe('when there are both drivers and plugins', function () {
            it('should create symlinks for all npm-installed extensions', async function () {
                const driverConfig = {
                    installedExtensions: {
                        'driver-for-test': {
                            installType: 'npm',
                            installPath: '/path/to/driver-for-test',
                        },
                    },
                };
                const pluginConfig = {
                    installedExtensions: {
                        'plugin-for-test': {
                            installType: 'npm',
                            installPath: '/path/to/plugin-for-test',
                        },
                    },
                };
                fsExistsStub.resolves(true);
                fsExistsStub.withArgs('/path/to/driver-for-test/node_modules/appium').resolves(false);
                fsExistsStub.withArgs('/path/to/plugin-for-test/node_modules/appium').resolves(false);
                await (0, extension_command_1.injectAppiumSymlinks)(asExtensionConfig(driverConfig), asExtensionConfig(pluginConfig), logger);
                (0, chai_1.expect)(fsSymlinkStub).to.have.been.calledTwice;
            });
            it('should not create symlinks for invalid format - no installPath', async function () {
                const driverConfig = {
                    installedExtensions: {
                        'driver-for-test': {
                            installType: 'npm',
                        },
                    },
                };
                const pluginConfig = {
                    installedExtensions: {
                        'plugin-for-test': {
                            installType: 'npm',
                        },
                    },
                };
                await (0, extension_command_1.injectAppiumSymlinks)(asExtensionConfig(driverConfig), asExtensionConfig(pluginConfig), logger);
                (0, chai_1.expect)(fsSymlinkStub).to.not.have.been.called;
            });
        });
        describe('when there are non-npm installed extensions', function () {
            for (const installType of ['git', 'local', 'github']) {
                it(`should skip ${installType}-installed extensions`, async function () {
                    const driverConfig = {
                        installedExtensions: {
                            [`${installType}-driver`]: {
                                installType,
                                installPath: `/path/to/${installType}-driver`,
                            },
                        },
                    };
                    const pluginConfig = { installedExtensions: {} };
                    await (0, extension_command_1.injectAppiumSymlinks)(asExtensionConfig(driverConfig), asExtensionConfig(pluginConfig), logger);
                    (0, chai_1.expect)(fsSymlinkStub).to.not.have.been.called;
                });
            }
            it('should only create symlinks for npm-installed extensions when mixed', async function () {
                const driverConfig = {
                    installedExtensions: {
                        'npm-driver': {
                            installType: 'npm',
                            installPath: '/path/to/npm-driver',
                        },
                        'git-driver': {
                            installType: 'git',
                            installPath: '/path/to/git-driver',
                        },
                    },
                };
                const pluginConfig = { installedExtensions: {} };
                fsExistsStub.resolves(true);
                fsExistsStub.withArgs('/path/to/npm-driver/node_modules/appium').resolves(false);
                await (0, extension_command_1.injectAppiumSymlinks)(asExtensionConfig(driverConfig), asExtensionConfig(pluginConfig), logger);
                (0, chai_1.expect)(fsSymlinkStub).to.have.been.calledOnce;
                (0, chai_1.expect)(fsSymlinkStub).to.have.been.calledWith(utils_1.appiumPackageRoot, '/path/to/npm-driver/node_modules/appium', 'dir');
            });
        });
        describe('error handling', function () {
            it('should log info message when symlink creation fails', async function () {
                const driverConfig = {
                    installedExtensions: {
                        'driver-for-test': {
                            installType: 'npm',
                            installPath: '/path/to/driver-for-test',
                        },
                    },
                };
                const pluginConfig = { installedExtensions: {} };
                fsExistsStub.resolves(true);
                fsExistsStub.withArgs('/path/to/driver-for-test/node_modules/appium').resolves(false);
                fsSymlinkStub.rejects(new Error('Permission denied'));
                await (0, extension_command_1.injectAppiumSymlinks)(asExtensionConfig(driverConfig), asExtensionConfig(pluginConfig), logger);
                (0, chai_1.expect)(logger.info).to.have.been.calledOnce;
                // @ts-ignore
                (0, chai_1.expect)(logger.info.args[0][0]).to.match(/Cannot create a symlink/);
                // @ts-ignore
                (0, chai_1.expect)(logger.info.args[0][0]).to.match(/Permission denied/);
            });
        });
        describe('with null or undefined configs', function () {
            it('should handle null installedExtensions', async function () {
                const driverConfig = { installedExtensions: null };
                const pluginConfig = { installedExtensions: null };
                await (0, extension_command_1.injectAppiumSymlinks)(asExtensionConfig(driverConfig), asExtensionConfig(pluginConfig), logger);
                (0, chai_1.expect)(fsSymlinkStub).to.not.have.been.called;
            });
            it('should handle undefined installedExtensions', async function () {
                const driverConfig = {};
                const pluginConfig = {};
                await (0, extension_command_1.injectAppiumSymlinks)(asExtensionConfig(driverConfig), asExtensionConfig(pluginConfig), logger);
                (0, chai_1.expect)(fsSymlinkStub).to.not.have.been.called;
            });
        });
    });
});
//# sourceMappingURL=extension-command.spec.js.map