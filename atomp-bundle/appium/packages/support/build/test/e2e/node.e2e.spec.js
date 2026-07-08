"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const lib_1 = require("../../lib");
describe('node utilities', function () {
    before(function () {
        (0, chai_1.use)(chai_as_promised_1.default);
    });
    describe('requirePackage', function () {
        it('should be able to require a local package', async function () {
            await (0, chai_1.expect)(lib_1.node.requirePackage('sinon')).to.not.be.rejected;
        });
        // XXX: see #15951
        it.skip('should be able to require a global package', async function () {
            await (0, chai_1.expect)(lib_1.node.requirePackage('npm')).to.not.be.rejected;
        });
        it('should fail to find uninstalled package', async function () {
            await (0, chai_1.expect)(lib_1.node.requirePackage('appium-foo-driver')).to.eventually.be.rejectedWith(/Unable to load package/);
        });
    });
});
//# sourceMappingURL=node.e2e.spec.js.map