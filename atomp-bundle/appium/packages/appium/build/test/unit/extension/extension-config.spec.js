"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../../lib/constants");
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const node_path_1 = __importDefault(require("node:path"));
const build_1 = require("../../../lib/helpers/build");
const helpers_1 = require("../../helpers");
const mocks_1 = require("./mocks");
const extension_config_1 = require("../../../lib/extension/extension-config");
const { expect } = chai_1.default;
chai_1.default.use(chai_as_promised_1.default);
describe('ExtensionConfig', function () {
    let sandbox;
    let ExtensionConfig;
    let Manifest;
    let MockAppiumSupport;
    beforeEach(function () {
        let overrides;
        ({ MockAppiumSupport, overrides, sandbox } = (0, mocks_1.initMocks)());
        ({ ExtensionConfig } = helpers_1.rewiremock.proxy(() => require('../../../lib/extension/extension-config'), overrides));
        ({ Manifest } = helpers_1.rewiremock.proxy(() => require('../../../lib/extension/manifest'), overrides));
    });
    afterEach(function () {
        sandbox.restore();
        // avoids a warning about too many listeners, caused by an exit handler in base-driver
        process.removeAllListeners('exit');
    });
    describe('ESM module resolution', function () {
        it('resolves ESM entry point with simple export', function () {
            expect((0, extension_config_1.resolveEsmEntryPoint)('./index.js')).to.eql('./index.js');
        });
        it('resolves ESM entry point with dot export', function () {
            expect((0, extension_config_1.resolveEsmEntryPoint)({ '.': './index.js' })).to.eql('./index.js');
        });
        it('resolves ESM entry point with import export', function () {
            expect((0, extension_config_1.resolveEsmEntryPoint)({ import: './index.js' })).to.eql('./index.js');
        });
        it('resolves ESM entry point with complex import export', function () {
            expect((0, extension_config_1.resolveEsmEntryPoint)({
                '.': { import: './index.js' },
            })).to.eql('./index.js');
        });
    });
    describe('instance method', function () {
        let config;
        let extData;
        beforeEach(function () {
            config = new ExtensionConfig(constants_1.DRIVER_TYPE, new Manifest('/some/path'));
            extData = {
                version: '1.0.0',
                automationName: 'Derp',
                mainClass: 'SomeClass',
                pkgName: 'derp',
                platformNames: ['dogs', 'cats'],
                installSpec: 'derp',
                installType: 'npm',
                appiumVersion: build_1.APPIUM_VER,
            };
            config.addExtension(extData.pkgName, extData);
        });
        describe('getGenericConfigProblems()', function () {
            describe('when there are no problems with the extension data', function () {
                it('should return an empty array', function () {
                    expect(config.getGenericConfigProblems(extData, extData.pkgName)).to.be.empty;
                });
            });
            describe('when the extension data is missing a "pkgName" field', function () {
                let pkgName;
                beforeEach(function () {
                    ({ pkgName } = extData);
                    delete extData.pkgName;
                });
                it('should return a problem', function () {
                    expect(config.getGenericConfigProblems(extData, pkgName)).to.eql([
                        {
                            err: 'Invalid or missing `name` field in my `package.json` and/or `extensions.yaml` (must be a string)',
                            val: undefined,
                        },
                    ]);
                });
            });
            describe('when the extension data is missing a "version" field', function () {
                beforeEach(function () {
                    delete extData.version;
                });
                it('should return a problem', function () {
                    expect(config.getGenericConfigProblems(extData, extData.pkgName)).to.eql([
                        {
                            err: 'Invalid or missing `version` field in my `package.json` and/or `extensions.yaml` (must be a string)',
                            val: undefined,
                        },
                    ]);
                });
            });
            describe('when the extension data is missing a "appium.mainClass" field', function () {
                beforeEach(function () {
                    delete extData.mainClass;
                });
                it('should return a problem', function () {
                    expect(config.getGenericConfigProblems(extData, extData.pkgName)).to.eql([
                        {
                            err: 'Invalid or missing `appium.mainClass` field in my `package.json` and/or `mainClass` field in `extensions.yaml` (must be a string)',
                            val: undefined,
                        },
                    ]);
                });
            });
        });
        describe('getGenericConfigWarnings()', function () {
            let extData;
            let config;
            beforeEach(function () {
                const manifest = Manifest.getInstance('/some/path');
                extData = {
                    version: '1.0.0',
                    automationName: 'Derp',
                    mainClass: 'SomeClass',
                    pkgName: 'derp',
                    platformNames: ['dogs', 'cats'],
                    installSpec: 'derp',
                    installType: 'npm',
                    appiumVersion: build_1.APPIUM_VER,
                };
                manifest.setExtension(constants_1.DRIVER_TYPE, extData.pkgName, extData);
                config = new ExtensionConfig(constants_1.DRIVER_TYPE, manifest);
            });
            describe('when the extension data is missing an `installSpec` field', function () {
                beforeEach(function () {
                    delete extData.installSpec;
                });
                it('should resolve w/ an appropriate warning', async function () {
                    await expect(config.getGenericConfigWarnings(extData, extData.pkgName)).to.eventually.eql([
                        `Driver "${extData.pkgName}" (package \`${extData.pkgName}\`) has 1 invalid or missing field ("installSpec") in \`extensions.yaml\`; this may cause upgrades done via the \`appium\` CLI tool to fail. Please reinstall with \`appium driver uninstall ${extData.pkgName}\` and \`appium driver install ${extData.pkgName}\` to attempt a fix.`,
                    ]);
                });
            });
            describe('when the extension data is missing an `installType` field', function () {
                beforeEach(function () {
                    delete extData.installType;
                });
                it('should resolve w/ an appropriate warning', async function () {
                    await expect(config.getGenericConfigWarnings(extData, extData.pkgName)).to.eventually.eql([
                        `Driver "${extData.pkgName}" (package \`${extData.pkgName}\`) has 1 invalid or missing field ("installType") in \`extensions.yaml\`; this may cause upgrades done via the \`appium\` CLI tool to fail. Please reinstall with \`appium driver uninstall ${extData.pkgName}\` and \`appium driver install ${extData.pkgName}\` to attempt a fix.`,
                    ]);
                });
            });
            describe('when the extension data is missing both `installType` and `installSpec` fields', function () {
                beforeEach(function () {
                    delete extData.installType;
                    delete extData.installSpec;
                });
                it('should resolve w/ an appropriate warning', async function () {
                    await expect(config.getGenericConfigWarnings(extData, extData.pkgName)).to.eventually.eql([
                        `Driver "${extData.pkgName}" (package \`${extData.pkgName}\`) has 2 invalid or missing fields ("installSpec", "installType") in \`extensions.yaml\`; this may cause upgrades done via the \`appium\` CLI tool to fail. Please reinstall with \`appium driver uninstall ${extData.pkgName}\` and \`appium driver install ${extData.pkgName}\` to attempt a fix.`,
                    ]);
                });
            });
            describe('when the extension data is missing an `appiumVersion` field', function () {
                beforeEach(function () {
                    delete extData.appiumVersion;
                });
                describe('when an upgrade is not available', function () {
                    beforeEach(function () {
                        MockAppiumSupport.npm.getLatestSafeUpgradeVersion.resolves(null);
                        MockAppiumSupport.npm.getLatestVersion.resolves(null);
                    });
                    it('should resolve w/ an appropriate warning', async function () {
                        await expect(config.getGenericConfigWarnings(extData, extData.pkgName)).to.eventually.eql([
                            `Driver "${extData.pkgName}" (package \`${extData.pkgName}\`) may be incompatible with the current version of Appium (v${build_1.APPIUM_VER}) due to an invalid or missing peer dependency on Appium. Please ask the developer of \`${extData.pkgName}\` to add a peer dependency on \`^appium@${build_1.APPIUM_VER}\`.`,
                        ]);
                    });
                });
                describe('when an upgrade is available', function () {
                    let updateVersion;
                    beforeEach(function () {
                        updateVersion = '1.1.0';
                        MockAppiumSupport.npm.getLatestVersion.resolves(updateVersion);
                        MockAppiumSupport.npm.getLatestSafeUpgradeVersion.resolves(updateVersion);
                    });
                    it('should resolve w/ an appropriate warning', async function () {
                        await expect(config.getGenericConfigWarnings(extData, extData.pkgName)).to.eventually.eql([
                            `Driver "${extData.pkgName}" (package \`${extData.pkgName}\`) may be incompatible with the current version of Appium (v${build_1.APPIUM_VER}) due to an invalid or missing peer dependency on Appium. A newer version of \`${extData.pkgName}\` is available; please attempt to upgrade "${extData.pkgName}" to v${updateVersion} or newer.`,
                        ]);
                    });
                });
            });
            describe('when the extension data has an `appiumVersion` field which does not satisfy the current version of Appium', function () {
                beforeEach(function () {
                    extData.appiumVersion = '1.9.9';
                });
                describe('when an upgrade is available', function () {
                    let updateVersion;
                    beforeEach(function () {
                        updateVersion = '1.1.0';
                        MockAppiumSupport.npm.getLatestVersion.resolves(updateVersion);
                        MockAppiumSupport.npm.getLatestSafeUpgradeVersion.resolves(updateVersion);
                    });
                    it('should resolve w/ an appropriate warning', async function () {
                        await expect(config.getGenericConfigWarnings(extData, extData.pkgName)).to.eventually.eql([
                            `Driver "${extData.pkgName}" (package \`${extData.pkgName}\`) may be incompatible with the current version of Appium (v${build_1.APPIUM_VER}) due to its peer dependency on Appium ${extData.appiumVersion}. Try to upgrade \`${extData.pkgName}\` to v${updateVersion} or newer.`,
                        ]);
                    });
                });
                describe('when no upgrade is available', function () {
                    beforeEach(function () {
                        MockAppiumSupport.util.compareVersions.returns(false);
                        MockAppiumSupport.npm.getLatestSafeUpgradeVersion.resolves(null);
                        MockAppiumSupport.npm.getLatestVersion.resolves(null);
                    });
                    it('should resolve w/ an appropriate warning', async function () {
                        await expect(config.getGenericConfigWarnings(extData, extData.pkgName)).to.eventually.eql([
                            `Driver "${extData.pkgName}" (package \`${extData.pkgName}\`) may be incompatible with the current version of Appium (v${build_1.APPIUM_VER}) due to its peer dependency on Appium ${extData.appiumVersion}. Please install a compatible version of the driver.`,
                        ]);
                    });
                });
            });
        });
        describe('_validate()', function () {
            describe('when there is a single warning', function () {
                beforeEach(function () {
                    sandbox.stub(config, 'getProblems').resolves([]);
                    sandbox.stub(config, 'getWarnings').resolves([{ err: 'some warning', val: 'whatever' }]);
                });
                it('should display a warning count of 1', async function () {
                    await config._validate({ foo: {} });
                    expect(MockAppiumSupport.logger.__logger.warn.calledWith('Appium encountered 1 warning while validating drivers found in manifest /some/path/extensions.yaml')).to.be.true;
                });
            });
            describe('when there is a single error', function () {
                beforeEach(function () {
                    sandbox.stub(config, 'getProblems').resolves([{ err: 'some warning', val: 'whatever' }]);
                    sandbox.stub(config, 'getWarnings').resolves([]);
                });
                it('should display an error count of 1', async function () {
                    await config._validate({ foo: {} });
                    expect(MockAppiumSupport.logger.__logger.error.calledWith('Appium encountered 1 error while validating drivers found in manifest /some/path/extensions.yaml')).to.be.true;
                });
            });
        });
        describe('require()', function () {
            beforeEach(function () {
                // the `ExtensionConfig` instance doesn't know about fake driver, since it hasn't been
                // loaded yet.  all we need for the purposes of the `require()` function is a `mainClass`, so
                // here we go.
                config.installedExtensions.fake = { pkgName: 'flotsam', mainClass: 'Jetsam' };
            });
            describe('when the extension is not actually installed', function () {
                it('should throw', async function () {
                    await expect(config.requireAsync('fake')).to.be.rejectedWith(/cannot find module/i);
                });
            });
            describe('when the extension does not export its main class', function () {
                beforeEach(function () {
                    // since we can't easily mock `require.resolve()` and `require()`, we need to use a real thing.
                    // that real thing will be `@appium/fake-driver`.
                    // ()`config.appiumHome` is stubbed already, so we can't just run `getInstallPath` as-is)
                    sandbox.stub(config, 'getInstallPath').returns(helpers_1.FAKE_DRIVER_DIR);
                });
                it('should throw', async function () {
                    await expect(config.requireAsync('fake')).to.be.rejectedWith(/cannot find module/i);
                });
            });
            describe('when extension is installed and correctly exports its main class', function () {
                const pluginModuleRoot = node_path_1.default.join(helpers_1.PROJECT_ROOT, 'packages', 'relaxed-caps-plugin');
                const packageJsonPath = node_path_1.default.join(pluginModuleRoot, 'package.json');
                const entryPointPath = node_path_1.default.join(pluginModuleRoot, 'build', 'lib', 'index.js');
                beforeEach(function () {
                    config.installedExtensions['relaxed-caps'] = {
                        mainClass: 'RelaxedCapsPlugin',
                    };
                    sandbox.stub(config, 'getInstallPath').returns(pluginModuleRoot);
                    // _resolveExtension reads package.json and uses manifest.main; delegate to real fs for this path
                    MockAppiumSupport.fs.readFile
                        .withArgs(packageJsonPath, 'utf8')
                        .callsFake(async () => (await import('node:fs/promises')).readFile(packageJsonPath, 'utf8'));
                    MockAppiumSupport.fs.exists.withArgs(entryPointPath).resolves(true);
                });
                it('should return the class by loading from the manifest main entry point', async function () {
                    expect(await config.requireAsync('relaxed-caps')).to.equal(require('@appium/relaxed-caps-plugin').RelaxedCapsPlugin);
                });
            });
        });
    });
});
//# sourceMappingURL=extension-config.spec.js.map