"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const npm_1 = require("../../lib/npm");
describe('npm module', function () {
    before(async function () {
        (0, chai_1.use)(chai_as_promised_1.default);
    });
    describe('getLatestVersion()', function () {
        describe('when the package is not published to the public registry', function () {
            it('should not throw', async function () {
                await (0, chai_1.expect)(npm_1.npm.getLatestVersion(process.cwd(), 'crusher-brush-resize-disfigure-props-desktop-blatancy-prologue')).to.not.be.rejected;
            });
            it('should resolve with "null"', async function () {
                await (0, chai_1.expect)(npm_1.npm.getLatestVersion(process.cwd(), 'crusher-brush-resize-disfigure-props-desktop-blatancy-prologue')).to.eventually.be.null;
            });
        });
    });
    describe('getLatestSafeUpgradeVersion()', function () {
        describe('when the package is not published to the public registry', function () {
            it('should not throw', async function () {
                await (0, chai_1.expect)(npm_1.npm.getLatestSafeUpgradeVersion(process.cwd(), 'crusher-brush-resize-disfigure-props-desktop-blatancy-prologue', '1.0.0')).to.eventually.be.null;
            });
            it('should resolve with "null"', async function () {
                await (0, chai_1.expect)(npm_1.npm.getLatestSafeUpgradeVersion(process.cwd(), 'crusher-brush-resize-disfigure-props-desktop-blatancy-prologue', '1.0.0')).to.eventually.be.null;
            });
        });
    });
});
//# sourceMappingURL=npm.e2e.spec.js.map