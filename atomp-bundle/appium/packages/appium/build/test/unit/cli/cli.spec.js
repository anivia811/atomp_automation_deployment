"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const support_1 = require("@appium/support");
const extension_1 = require("../../../lib/extension");
const manifest_1 = require("../../../lib/extension/manifest");
const driver_command_1 = __importDefault(require("../../../lib/cli/driver-command"));
const sinon_1 = require("sinon");
const chai_1 = require("chai");
describe('DriverCommand', function () {
    let appiumHome;
    let config;
    const driver = 'fake';
    const pkgName = '@appium/fake-driver';
    let dc;
    let sandbox;
    beforeEach(async function () {
        sandbox = (0, sinon_1.createSandbox)();
        appiumHome = await support_1.tempDir.openDir();
        manifest_1.Manifest.getInstance.cache = new Map();
        sandbox.stub(support_1.fs, 'exists').resolves(false);
        config = (await (0, extension_1.loadExtensions)(appiumHome)).driverConfig;
        config.installedExtensions = {
            [driver]: {
                version: '1.0.0',
                pkgName,
                automationName: 'Fake',
                platformNames: ['Fake'],
                mainClass: 'FakeDriver',
                installType: 'npm',
                installSpec: pkgName,
                installPath: '',
            },
        };
        dc = new driver_command_1.default({ config, json: true });
    });
    afterEach(async function () {
        await support_1.fs.rimraf(appiumHome);
        sandbox.restore();
    });
    describe('#checkForExtensionUpdate', function () {
        let npmMock;
        beforeEach(function () {
            npmMock = sandbox.mock(support_1.npm);
        });
        function setupDriverUpdate(curVersion, latestVersion, latestSafeVersion) {
            npmMock
                .expects('getLatestVersion')
                .once()
                .withExactArgs(appiumHome, pkgName)
                .returns(latestVersion);
            npmMock
                .expects('getLatestSafeUpgradeVersion')
                .once()
                .withExactArgs(appiumHome, pkgName, curVersion)
                .returns(latestSafeVersion);
        }
        it('should not return an unsafe update if it is same as safe update', async function () {
            setupDriverUpdate('1.0.0', '1.1.0', '1.1.0');
            await (0, chai_1.expect)(dc.checkForExtensionUpdate('fake')).to.eventually.eql({
                current: '1.0.0',
                safeUpdate: '1.1.0',
                unsafeUpdate: null,
            });
            npmMock.verify();
        });
        it('should not return a safe update if there is not one', async function () {
            setupDriverUpdate('1.0.0', '2.0.0', null);
            await (0, chai_1.expect)(dc.checkForExtensionUpdate('fake')).to.eventually.eql({
                current: '1.0.0',
                safeUpdate: null,
                unsafeUpdate: '2.0.0',
            });
            npmMock.verify();
        });
        it('should return both safe and unsafe update', async function () {
            setupDriverUpdate('1.0.0', '2.0.0', '1.5.3');
            await (0, chai_1.expect)(dc.checkForExtensionUpdate('fake')).to.eventually.eql({
                current: '1.0.0',
                safeUpdate: '1.5.3',
                unsafeUpdate: '2.0.0',
            });
            npmMock.verify();
        });
    });
});
//# sourceMappingURL=cli.spec.js.map