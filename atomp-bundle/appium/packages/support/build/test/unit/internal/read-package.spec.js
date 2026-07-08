"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const lib_1 = require("../../../lib");
const read_package_1 = require("../../../lib/internal/read-package");
describe('internal/read-package', function () {
    let fixtureRoot;
    before(function () {
        (0, chai_1.use)(chai_as_promised_1.default);
    });
    beforeEach(async function () {
        fixtureRoot = await lib_1.tempDir.openDir();
    });
    afterEach(async function () {
        if (fixtureRoot) {
            await lib_1.fs.rimraf(fixtureRoot);
        }
    });
    async function writePackageJson(dir, pkg = { name: 'fixture-pkg', version: '1.2.3' }) {
        await (0, promises_1.writeFile)(node_path_1.default.join(dir, 'package.json'), JSON.stringify(pkg), 'utf8');
    }
    describe('packageDirectorySync()', function () {
        it('should return undefined when no package.json exists in the ancestry', function () {
            (0, chai_1.expect)((0, read_package_1.packageDirectorySync)({ cwd: fixtureRoot })).to.be.undefined;
        });
        it('should find package.json in the current directory', async function () {
            await writePackageJson(fixtureRoot);
            (0, chai_1.expect)((0, read_package_1.packageDirectorySync)({ cwd: fixtureRoot })).to.equal(fixtureRoot);
        });
        it('should find the nearest package.json in a parent directory', async function () {
            await writePackageJson(fixtureRoot);
            const nestedDir = node_path_1.default.join(fixtureRoot, 'nested', 'deep');
            await (0, promises_1.mkdir)(nestedDir, { recursive: true });
            (0, chai_1.expect)((0, read_package_1.packageDirectorySync)({ cwd: nestedDir })).to.equal(fixtureRoot);
        });
    });
    describe('readPackageSync()', function () {
        it('should throw when package.json is missing', function () {
            (0, chai_1.expect)(() => (0, read_package_1.readPackageSync)({ cwd: fixtureRoot })).to.throw(Error);
        });
        it('should read and normalize package.json', async function () {
            await writePackageJson(fixtureRoot, {
                name: 'fixture-pkg',
                version: '1.2.3',
                repository: 'https://github.com/appium/appium',
            });
            const pkg = (0, read_package_1.readPackageSync)({ cwd: fixtureRoot });
            (0, chai_1.expect)(pkg.name).to.equal('fixture-pkg');
            (0, chai_1.expect)(pkg.version).to.equal('1.2.3');
            (0, chai_1.expect)(pkg.repository).to.eql({
                type: 'git',
                url: 'git+https://github.com/appium/appium.git',
            });
        });
        it('should preserve raw fields when normalization is disabled', async function () {
            const repository = 'https://github.com/appium/appium';
            await writePackageJson(fixtureRoot, {
                name: 'fixture-pkg',
                version: '1.2.3',
                repository,
            });
            const pkg = (0, read_package_1.readPackageSync)({ cwd: fixtureRoot, normalize: false });
            (0, chai_1.expect)(pkg.repository).to.equal(repository);
        });
    });
    describe('readPackage()', function () {
        it('should reject when package.json is missing', async function () {
            await (0, chai_1.expect)((0, read_package_1.readPackage)({ cwd: fixtureRoot })).to.be.rejectedWith(Error);
        });
        it('should read and normalize package.json', async function () {
            await writePackageJson(fixtureRoot, {
                name: 'fixture-pkg',
                version: '4.5.6',
                repository: 'https://github.com/appium/appium',
            });
            const pkg = await (0, read_package_1.readPackage)({ cwd: fixtureRoot });
            (0, chai_1.expect)(pkg.name).to.equal('fixture-pkg');
            (0, chai_1.expect)(pkg.version).to.equal('4.5.6');
            (0, chai_1.expect)(pkg.repository).to.eql({
                type: 'git',
                url: 'git+https://github.com/appium/appium.git',
            });
        });
    });
});
//# sourceMappingURL=read-package.spec.js.map