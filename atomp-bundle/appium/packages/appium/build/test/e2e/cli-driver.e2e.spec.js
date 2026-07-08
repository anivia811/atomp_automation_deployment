"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../lib/utils");
const teen_process_1 = require("teen_process");
const support_1 = require("@appium/support");
const node_path_1 = __importDefault(require("node:path"));
const constants_1 = require("../../lib/constants");
const helpers_1 = require("../helpers");
const e2e_helpers_1 = require("./e2e-helpers");
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const { expect } = chai_1.default;
chai_1.default.use(chai_as_promised_1.default);
const TEST_DRIVER_DIR = node_path_1.default.dirname((0, helpers_1.resolveFixture)('test-driver/package.json'));
const TEST_DRIVER_INVALID_PEERS_DIR = node_path_1.default.dirname((0, helpers_1.resolveFixture)('test-driver-invalid-peer-dep/package.json'));
describe('Driver CLI', function () {
    this.timeout(90000);
    let appiumHome;
    let runList;
    let runRun;
    let runInstall;
    let runUninstall;
    let runDoctor;
    async function resetAppiumHome() {
        await support_1.fs.rimraf(appiumHome);
        await support_1.fs.mkdirp(appiumHome);
    }
    before(async function () {
        appiumHome = await support_1.tempDir.openDir();
        const run = (0, e2e_helpers_1.runAppiumJson)(appiumHome);
        runInstall = (args) => run([constants_1.DRIVER_TYPE, constants_1.EXT_SUBCOMMAND_INSTALL, ...args]);
        runUninstall = (args) => run([constants_1.DRIVER_TYPE, constants_1.EXT_SUBCOMMAND_UNINSTALL, ...args]);
        runList = async (args = []) => run([constants_1.DRIVER_TYPE, constants_1.EXT_SUBCOMMAND_LIST, ...args]);
        runRun = (args) => run([constants_1.DRIVER_TYPE, constants_1.EXT_SUBCOMMAND_RUN, ...args]);
        runDoctor = async (args) => run([constants_1.DRIVER_TYPE, constants_1.EXT_SUBCOMMAND_DOCTOR, ...args]);
    });
    after(async function () {
        await support_1.fs.rimraf(appiumHome);
    });
    describe(constants_1.EXT_SUBCOMMAND_LIST, function () {
        it('should list available drivers', async function () {
            const { stderr } = await (0, e2e_helpers_1.runAppiumRaw)(appiumHome, [constants_1.DRIVER_TYPE, constants_1.EXT_SUBCOMMAND_LIST], {});
            for (const d of Object.keys(constants_1.KNOWN_DRIVERS)) {
                expect(stderr).to.match(new RegExp(`${d}.+[not installed]`));
            }
        });
        it('should list available drivers in json format', async function () {
            const driverData = await runList();
            for (const d of Object.keys(constants_1.KNOWN_DRIVERS)) {
                expect(driverData[d]).to.have.property('installed', false);
                expect(driverData[d]).to.have.property('pkgName', constants_1.KNOWN_DRIVERS[d]);
                if (driverData[d].repositoryUrl) {
                    expect(driverData[d].repositoryUrl).to.be.a('string');
                }
            }
        });
        it('should allow filtering by installed drivers', async function () {
            const out = await runList(['--installed']);
            expect(out).to.eql({});
        });
        it('should show updates for installed drivers with --updates', async function () {
            if (support_1.system.isWindows()) {
                return this.skip();
            }
            const versions = JSON.parse((await (0, teen_process_1.exec)('npm', ['view', '@appium/fake-driver', 'versions', '--json'], {
                encoding: 'utf-8',
            })).stdout);
            const penultimateFakeDriverVersionAsOfRightNow = versions[versions.length - 2];
            await resetAppiumHome();
            await runInstall([
                `@appium/fake-driver@${penultimateFakeDriverVersionAsOfRightNow}`,
                '--source',
                'npm',
            ]);
            const listResult = (await runList(['--updates']));
            const { fake } = listResult;
            const updateVersion = fake?.updateVersion ?? fake?.unsafeUpdateVersion;
            if (!updateVersion) {
                throw new Error(`No update version found. Expected an update from ${penultimateFakeDriverVersionAsOfRightNow} to a newer version.`);
            }
            expect(support_1.util.compareVersions(String(updateVersion), '>', penultimateFakeDriverVersionAsOfRightNow)).to.be.true;
            const { stderr } = await (0, e2e_helpers_1.runAppiumRaw)(appiumHome, [constants_1.DRIVER_TYPE, constants_1.EXT_SUBCOMMAND_LIST, '--updates'], {});
            expect(stderr).to.match(new RegExp(`fake.+[${updateVersion} available]`));
        });
        describe('if a driver is not published to npm', function () {
            it('should not throw an error', async function () {
                await resetAppiumHome();
                await (0, e2e_helpers_1.installLocalExtension)(appiumHome, constants_1.DRIVER_TYPE, TEST_DRIVER_DIR);
                await expect(runList(['--updates'])).not.to.be.rejected;
            });
        });
    });
    describe(constants_1.EXT_SUBCOMMAND_INSTALL, function () {
        beforeEach(async function () {
            await resetAppiumHome();
        });
        it('should not install appium in APPIUM_HOME', async function () {
            await (0, e2e_helpers_1.installLocalExtension)(appiumHome, constants_1.DRIVER_TYPE, helpers_1.FAKE_DRIVER_DIR);
            await expect(support_1.fs.stat(node_path_1.default.join(appiumHome, 'node_modules', 'appium'))).to.be.rejected;
        });
        it('should install a driver from the list of known drivers', async function () {
            const ret = await runInstall(['uiautomator2']);
            expect(ret.uiautomator2.pkgName).to.eql('appium-uiautomator2-driver');
            expect(ret.uiautomator2.installType).to.eql('npm');
            expect(ret.uiautomator2.installSpec).to.eql('uiautomator2');
            const list = await runList(['--installed']);
            const rest = (0, utils_1.omitKeys)(list.uiautomator2 ?? {}, ['installed', 'repositoryUrl']);
            expect(rest).to.deep.include({
                pkgName: ret.uiautomator2.pkgName,
                installType: ret.uiautomator2.installType,
                installSpec: ret.uiautomator2.installSpec,
            });
        });
        it('should install a driver from npm', async function () {
            const ret = await runInstall(['@appium/fake-driver', '--source', 'npm']);
            expect(ret.fake.pkgName).to.eql('@appium/fake-driver');
            expect(ret.fake.installType).to.eql('npm');
            expect(ret.fake.installSpec).to.eql('@appium/fake-driver');
            const list = await runList(['--installed']);
            const rest = (0, utils_1.omitKeys)(list.fake ?? {}, ['installed', 'repositoryUrl']);
            expect(rest).to.deep.include({
                pkgName: ret.fake.pkgName,
                installType: ret.fake.installType,
                installSpec: ret.fake.installSpec,
            });
        });
        it('should install a driver from npm and a local driver', async function () {
            await runInstall(['@appium/fake-driver', '--source', 'npm']);
            await (0, e2e_helpers_1.installLocalExtension)(appiumHome, constants_1.DRIVER_TYPE, TEST_DRIVER_DIR);
            const list = await runList(['--installed']);
            expect(list.fake).to.exist;
            expect(list.test).to.exist;
            await (0, utils_1.resolveFrom)(appiumHome, '@appium/fake-driver/package.json');
            await (0, utils_1.resolveFrom)(appiumHome, '@appium/test-driver/package.json');
        });
        it('should install _two_ drivers from npm', async function () {
            await runInstall(['@appium/fake-driver', '--source', 'npm']);
            await runInstall(['appium-uiautomator2-driver', '--source', 'npm']);
            const list = await runList(['--installed']);
            expect(list.fake).to.exist;
            expect(list.uiautomator2).to.exist;
            await (0, utils_1.resolveFrom)(appiumHome, '@appium/fake-driver/package.json');
            await (0, utils_1.resolveFrom)(appiumHome, 'appium-uiautomator2-driver/package.json');
        });
        it('should install a driver from npm with a specific version/tag', async function () {
            const currentFakeDriverVersionAsOfRightNow = '3.0.5';
            const installSpec = `@appium/fake-driver@${currentFakeDriverVersionAsOfRightNow}`;
            const ret = await runInstall([installSpec, '--source', 'npm']);
            expect(ret.fake.pkgName).to.eql('@appium/fake-driver');
            expect(ret.fake.installType).to.eql('npm');
            expect(ret.fake.installSpec).to.eql(installSpec);
            const list = await runList(['--installed']);
            const rest = (0, utils_1.omitKeys)(list.fake ?? {}, ['installed', 'repositoryUrl']);
            expect(rest).to.deep.include({
                pkgName: ret.fake.pkgName,
                installType: ret.fake.installType,
                installSpec: ret.fake.installSpec,
            });
        });
        it('should install a driver from GitHub', async function () {
            if (process.env.CI) {
                return this.skip();
            }
            const ret = await runInstall([
                'appium/appium-fake-driver',
                '--source',
                'github',
                '--package',
                'appium-fake-driver',
            ]);
            expect(ret.fake.pkgName).to.eql('appium-fake-driver');
            expect(ret.fake.installType).to.eql('github');
            expect(ret.fake.installSpec).to.eql('appium/appium-fake-driver');
            const list = await runList(['--installed']);
            const rest = (0, utils_1.omitKeys)(list.fake ?? {}, ['installed', 'repositoryUrl']);
            expect(rest).to.deep.include({
                pkgName: ret.fake.pkgName,
                installType: ret.fake.installType,
                installSpec: ret.fake.installSpec,
            });
        });
        it('should install a driver from a local git repo', async function () {
            const ret = await runInstall([
                helpers_1.FAKE_DRIVER_DIR,
                '--source',
                'git',
                '--package',
                '@appium/fake-driver',
            ]);
            expect(ret.fake.pkgName).to.eql('@appium/fake-driver');
            expect(ret.fake.installType).to.eql('git');
            expect(ret.fake.installSpec).to.eql(helpers_1.FAKE_DRIVER_DIR);
            const list = await runList(['--installed', '--json']);
            const rest = (0, utils_1.omitKeys)(list.fake ?? {}, ['installed', 'repositoryUrl']);
            expect(rest).to.deep.include({
                pkgName: ret.fake.pkgName,
                installType: ret.fake.installType,
                installSpec: ret.fake.installSpec,
            });
        });
        it('should install a driver from a remote git repo', async function () {
            if (process.env.CI) {
                return this.skip();
            }
            const ret = await runInstall([
                'git+https://github.com/appium/appium-fake-driver.git',
                '--source',
                'git',
                '--package',
                'appium-fake-driver',
            ]);
            expect(ret.fake.pkgName).to.eql('appium-fake-driver');
            expect(ret.fake.installType).to.eql('git');
            expect(ret.fake.installSpec).to.eql('git+https://github.com/appium/appium-fake-driver');
            const list = await runList(['--installed']);
            const rest = (0, utils_1.omitKeys)(list.fake ?? {}, ['installed', 'repositoryUrl']);
            expect(rest).to.deep.include({
                pkgName: ret.fake.pkgName,
                installType: ret.fake.installType,
                installSpec: ret.fake.installSpec,
            });
        });
        describe('when peer dependencies are invalid', function () {
            it('should install the driver anyway', async function () {
                const ret = await (0, e2e_helpers_1.installLocalExtension)(appiumHome, constants_1.DRIVER_TYPE, TEST_DRIVER_INVALID_PEERS_DIR);
                expect(ret.test.pkgName).to.equal('test-driver-invalid-peer-dep');
                const list = await runList(['--installed']);
                expect(list.test.pkgName).to.equal('test-driver-invalid-peer-dep');
            });
            it('should warn the user that peer deps are invalid', async function () {
                const ret = await (0, e2e_helpers_1.runAppiumRaw)(appiumHome, [constants_1.DRIVER_TYPE, constants_1.EXT_SUBCOMMAND_INSTALL, '--source', 'local', TEST_DRIVER_INVALID_PEERS_DIR], {});
                if ('stderr' in ret) {
                    expect(ret.stderr).to.match(/may be incompatible with the current version of Appium/i);
                    expect(ret.stderr).to.match(/successfully installed/i);
                }
            });
        });
        describe('when peer dependencies are valid', function () {
            it('should not display a warning', async function () {
                const ret = await (0, e2e_helpers_1.runAppiumRaw)(appiumHome, [constants_1.DRIVER_TYPE, constants_1.EXT_SUBCOMMAND_INSTALL, '--source', 'local', TEST_DRIVER_DIR], {});
                if ('stderr' in ret) {
                    expect(ret.stderr).to.not.match(/may be incompatible with the current version of Appium/i);
                    expect(ret.stderr).to.match(/successfully installed/i);
                }
            });
        });
    });
    describe(`Local ${constants_1.EXT_SUBCOMMAND_INSTALL}`, function () {
        let installResult;
        let listResult;
        let installPath;
        before(async function () {
            await resetAppiumHome();
            installResult = await (0, e2e_helpers_1.installLocalExtension)(appiumHome, constants_1.DRIVER_TYPE, helpers_1.FAKE_DRIVER_DIR);
            listResult = await runList(['--installed']);
            installPath = await (0, utils_1.resolveFrom)(appiumHome, '@appium/fake-driver');
        });
        it('should install a driver from a local npm module', function () {
            expect(installResult.fake).to.include({
                pkgName: '@appium/fake-driver',
                installType: 'local',
                installSpec: helpers_1.FAKE_DRIVER_DIR,
            });
        });
        it('should show the installed driver in the list of extensions', function () {
            expect(listResult.fake).to.deep.include(installResult.fake);
        });
        it.skip('should create a symlink', async function () {
            const srcStat = await support_1.fs.lstat(helpers_1.FAKE_DRIVER_DIR);
            const destStat = await support_1.fs.lstat(appiumHome);
            if (srcStat.dev !== destStat.dev) {
                return this.skip();
            }
            const stat = await support_1.fs.lstat(installPath);
            expect(stat.isSymbolicLink()).to.be.true;
        });
    });
    describe('uninstall', function () {
        beforeEach(async function () {
            await resetAppiumHome();
            await (0, e2e_helpers_1.installLocalExtension)(appiumHome, constants_1.DRIVER_TYPE, helpers_1.FAKE_DRIVER_DIR);
        });
        it('should uninstall a driver based on its driver name', async function () {
            const uninstall = await runUninstall(['fake']);
            expect(uninstall).to.not.have.key('fake');
            await expect(support_1.fs.exists(node_path_1.default.join(appiumHome, 'node_modules', '@appium', 'fake-driver'))).to
                .eventually.be.false;
        });
    });
    describe('run', function () {
        const driverName = 'fake';
        before(async function () {
            await resetAppiumHome();
            await (0, e2e_helpers_1.installLocalExtension)(appiumHome, constants_1.DRIVER_TYPE, helpers_1.FAKE_DRIVER_DIR);
        });
        describe('when the driver and script is valid', function () {
            const scriptName = 'fake-success';
            describe('when the script completes successfully', function () {
                it('should result in success', async function () {
                    const out = await runRun([driverName, scriptName]);
                    expect(out).to.not.have.property('error');
                });
            });
            describe('when the script fails', function () {
                it('should throw an error', async function () {
                    await expect(runRun([driverName, 'fake-error'])).to.be.rejectedWith(Error);
                });
            });
            describe('when passed extra arguments', function () {
                it('should pass them to the script', async function () {
                    const out = await runRun([driverName, scriptName, '--foo', '--bar']);
                    expect(out).to.not.have.property('error');
                    expect(out.output).to.match(/--foo --bar/);
                });
            });
        });
        describe('when the driver is valid but the script is not', function () {
            it('should throw an error', async function () {
                await expect(runRun([driverName, 'foo'])).to.be.rejectedWith(Error);
            });
        });
        describe('when the driver and script are invalid', function () {
            it('should throw an error', async function () {
                await expect(runRun(['foo', 'bar'])).to.be.rejectedWith(Error);
            });
        });
    });
    describe('doctor', function () {
        const driverName = 'fake';
        before(async function () {
            await resetAppiumHome();
            await (0, e2e_helpers_1.installLocalExtension)(appiumHome, constants_1.DRIVER_TYPE, helpers_1.FAKE_DRIVER_DIR);
        });
        describe('when the driver defines doctor checks', function () {
            it('should load and run them', async function () {
                const checksLen = await runDoctor([driverName]);
                expect(checksLen).to.eql(2);
            });
        });
    });
});
//# sourceMappingURL=cli-driver.e2e.spec.js.map