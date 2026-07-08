"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const sinon_1 = require("sinon");
const support_1 = require("@appium/support");
const build_1 = require("../../../lib/helpers/build");
const main_helpers_1 = require("../../../lib/bootstrap/main-helpers");
const logger_1 = require("../../../lib/logger");
const { expect } = chai_1.default;
chai_1.default.use(chai_as_promised_1.default);
describe('bootstrap/main-helpers', function () {
    let sandbox;
    beforeEach(function () {
        sandbox = (0, sinon_1.createSandbox)();
    });
    afterEach(function () {
        sandbox.restore();
    });
    describe('showBuildInfo()', function () {
        let log;
        beforeEach(function () {
            log = sandbox.spy(console, 'log');
        });
        it('should log build info to console', async function () {
            const config = (0, build_1.getBuildInfo)();
            await (0, main_helpers_1.showBuildInfo)();
            expect(log.calledOnce).to.be.true;
            expect(log.firstCall.args).to.contain(JSON.stringify(config));
        });
    });
    describe('inspect()', function () {
        it('should log the result of inspecting a value', function () {
            const infoLog = sandbox.spy(logger_1.log, 'info');
            (0, main_helpers_1.inspect)({ foo: 'bar' });
            expect(support_1.console.stripColors(infoLog.firstCall.firstArg)).to.match(/\{\s*\n*foo:\s'bar'\s*\n*\}/);
        });
    });
});
//# sourceMappingURL=main-helpers.spec.js.map