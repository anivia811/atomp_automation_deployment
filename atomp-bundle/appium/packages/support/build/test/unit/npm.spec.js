"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const npm_1 = require("../../lib/npm");
describe('npm', function () {
    before(function () {
        (0, chai_1.use)(chai_as_promised_1.default);
    });
    describe('resolveFrom()', function () {
        const supportRoot = node_path_1.default.join(__dirname, '..', '..');
        it('should resolve a package path from a directory', async function () {
            const resolved = await (0, npm_1.resolveFrom)(supportRoot, 'semver/package.json');
            (0, chai_1.expect)(resolved).to.match(/semver[/\\]package\.json$/);
        });
        it('should reject when the module cannot be resolved', async function () {
            await (0, chai_1.expect)((0, npm_1.resolveFrom)(supportRoot, 'nonexistent-appium-package-xyz/package.json')).to
                .eventually.be.rejected;
        });
    });
    describe('getLatestSafeUpgradeFromVersions()', function () {
        const versions1 = [
            '0.1.0',
            '0.1.1',
            '0.2.0',
            '0.2.5',
            '1.0.0',
            '1.0.1',
            '1.1.5',
            '1.2.7',
            '2.0.0',
            '1.2.8-beta',
            '1.2.9-alpha',
            '1.3.0-rc',
            '2.0.1-beta',
        ];
        const npm = new npm_1.NPM();
        it('should get the latest minor upgrade in a list of versions', function () {
            (0, chai_1.expect)(npm.getLatestSafeUpgradeFromVersions('0.1.0', versions1)).to.eql('0.2.5');
            (0, chai_1.expect)(npm.getLatestSafeUpgradeFromVersions('1.0.0', versions1)).to.eql('1.2.7');
            (0, chai_1.expect)(npm.getLatestSafeUpgradeFromVersions('0.2.0', versions1)).to.eql('0.2.5');
        });
        it('should throw if the current version cannot be parsed', function () {
            (0, chai_1.expect)(() => {
                npm.getLatestSafeUpgradeFromVersions('', versions1);
            }).to.throw();
        });
        it('should ignore an error if one of versions cannot be parsed', function () {
            (0, chai_1.expect)(npm.getLatestSafeUpgradeFromVersions('0.1.0', ['', '0.2.0'])).to.eql('0.2.0');
        });
        it('should return null if no newer version is found', function () {
            (0, chai_1.expect)(npm.getLatestSafeUpgradeFromVersions('10', versions1)).to.be.null;
        });
    });
});
//# sourceMappingURL=npm.spec.js.map