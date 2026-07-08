"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const lib_1 = require("../../lib");
const env_1 = require("../../lib/env");
describe('environment', function () {
    let cwd;
    let oldEnvAppiumHome;
    before(async function () {
        (0, chai_1.use)(chai_as_promised_1.default);
        cwd = await lib_1.tempDir.openDir();
    });
    beforeEach(function () {
        // All of these functions are memoized, so we need to reset them before each test.
        env_1.resolveManifestPath.cache = new Map();
        env_1.resolveAppiumHome.cache = new Map();
        env_1.findAppiumDependencyPackage.cache = new Map();
        env_1.readPackageInDir.cache = new Map();
        oldEnvAppiumHome = process.env.APPIUM_HOME;
        delete process.env.APPIUM_HOME;
    });
    after(async function () {
        await lib_1.fs.rimraf(cwd);
    });
    afterEach(function () {
        process.env.APPIUM_HOME = oldEnvAppiumHome;
    });
    describe('resolution of APPIUM_HOME', function () {
        describe('when `appium` is not a package nor can be resolved from the CWD', function () {
            describe('when `APPIUM_HOME` is not present in the environment', function () {
                describe('when providing no `cwd` parameter', function () {
                    /**
                     * If no `cwd` is provided, resolveManifestPath calls resolveAppiumHome, which depends on
                     * the current working directory (process.cwd()). To isolate these tests we chdir to a temp
                     * dir (the same `cwd` we already set up) and restore the original cwd in afterEach.
                     */
                    let oldCwd;
                    beforeEach(function () {
                        oldCwd = process.cwd();
                        process.chdir(cwd);
                    });
                    afterEach(function () {
                        process.chdir(oldCwd);
                    });
                    it('should resolve to the default `APPIUM_HOME`', async function () {
                        await (0, chai_1.expect)((0, env_1.resolveAppiumHome)()).to.eventually.equal(env_1.DEFAULT_APPIUM_HOME);
                    });
                });
                describe('when providing a `cwd` parameter', function () {
                    it('should resolve to the default `APPIUM_HOME`', async function () {
                        await (0, chai_1.expect)((0, env_1.resolveAppiumHome)(cwd)).to.eventually.equal(env_1.DEFAULT_APPIUM_HOME);
                    });
                });
            });
            describe('when `APPIUM_HOME` is present in the environment', function () {
                beforeEach(function () {
                    process.env.APPIUM_HOME = cwd;
                });
                describe('when providing no `cwd` parameter', function () {
                    it('should resolve with `APPIUM_HOME` from env', async function () {
                        await (0, chai_1.expect)((0, env_1.resolveAppiumHome)()).to.eventually.equal(process.env.APPIUM_HOME);
                    });
                });
                describe('when providing an `cwd` parameter', function () {
                    it('should resolve with `APPIUM_HOME` from env', async function () {
                        await (0, chai_1.expect)((0, env_1.resolveAppiumHome)('/root')).to.eventually.equal(process.env.APPIUM_HOME);
                    });
                });
            });
        });
        describe('when `appium` is not a dependency', function () {
            it('should resolve with `DEFAULT_APPIUM_HOME`', async function () {
                await (0, chai_1.expect)((0, env_1.resolveAppiumHome)(cwd)).to.eventually.equal(env_1.DEFAULT_APPIUM_HOME);
            });
        });
        describe('when `appium` is a dependency and APPIUM_HOME is unset', function () {
            beforeEach(function () {
                delete process.env.APPIUM_HOME;
            });
            describe('when `appium` is installed', function () {
                before(async function () {
                    await lib_1.fs.mkdirp(node_path_1.default.join(cwd, 'node_modules'));
                });
                after(async function () {
                    await lib_1.fs.rimraf(node_path_1.default.join(cwd, 'node_modules'));
                });
                describe('when `appium` is at the current version', function () {
                    beforeEach(async function () {
                        await lib_1.fs.copyFile(node_path_1.default.join(__dirname, 'fixture', 'appium-v2-dependency.package.json'), node_path_1.default.join(cwd, 'package.json'));
                        await lib_1.fs.copyFile(node_path_1.default.join(__dirname, 'fixture', 'appium-v2-package'), node_path_1.default.join(cwd, 'node_modules', 'appium'));
                    });
                    afterEach(async function () {
                        await lib_1.fs.unlink(node_path_1.default.join(cwd, 'package.json'));
                    });
                    it('should resolve with `cwd`', async function () {
                        await (0, chai_1.expect)((0, env_1.resolveAppiumHome)(cwd)).to.eventually.equal(cwd);
                    });
                });
                describe('when `appium` is an old version', function () {
                    beforeEach(async function () {
                        await lib_1.fs.copyFile(node_path_1.default.join(__dirname, 'fixture', 'appium-v1-dependency.package.json'), node_path_1.default.join(cwd, 'package.json'));
                        await lib_1.fs.copyFile(node_path_1.default.join(__dirname, 'fixture', 'appium-v1-package'), node_path_1.default.join(cwd, 'node_modules', 'appium'));
                    });
                    afterEach(async function () {
                        await lib_1.fs.unlink(node_path_1.default.join(cwd, 'package.json'));
                    });
                    it('should resolve with `DEFAULT_APPIUM_HOME`', async function () {
                        await (0, chai_1.expect)((0, env_1.resolveAppiumHome)(cwd)).to.eventually.equal(env_1.DEFAULT_APPIUM_HOME);
                    });
                });
            });
            describe('when `appium` has not been installed', function () {
                describe('when `appium` dep requested is current version', function () {
                    before(async function () {
                        await lib_1.fs.copyFile(node_path_1.default.join(__dirname, 'fixture', 'appium-v2-dependency.package.json'), node_path_1.default.join(cwd, 'package.json'));
                    });
                    after(async function () {
                        await lib_1.fs.unlink(node_path_1.default.join(cwd, 'package.json'));
                    });
                    it('should resolve with `cwd`', async function () {
                        await (0, chai_1.expect)((0, env_1.resolveAppiumHome)(cwd)).to.eventually.equal(cwd);
                    });
                });
                describe('when `appium` dep requested is an old version', function () {
                    before(async function () {
                        await lib_1.fs.copyFile(node_path_1.default.join(__dirname, 'fixture', 'appium-v1-dependency.package.json'), node_path_1.default.join(cwd, 'package.json'));
                    });
                    after(async function () {
                        await lib_1.fs.unlink(node_path_1.default.join(cwd, 'package.json'));
                    });
                    it('should resolve with `DEFAULT_APPIUM_HOME`', async function () {
                        await (0, chai_1.expect)((0, env_1.resolveAppiumHome)(cwd)).to.eventually.equal(env_1.DEFAULT_APPIUM_HOME);
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=env.e2e.spec.js.map