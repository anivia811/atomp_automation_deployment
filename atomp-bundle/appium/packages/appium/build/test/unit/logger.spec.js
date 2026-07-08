"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logsink_1 = require("../../lib/logsink");
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const sinon_1 = require("sinon");
const support_1 = require("@appium/support");
const forceLogs = process.env._FORCE_LOGS;
process.env._FORCE_LOGS = '1';
const log = support_1.logger.getLogger('Appium');
describe('logging', function () {
    let sandbox;
    let stderrSpy;
    let stdoutSpy;
    beforeEach(async function () {
        (0, chai_1.use)(chai_as_promised_1.default);
        sandbox = (0, sinon_1.createSandbox)();
        stderrSpy = sandbox.spy(process.stderr, 'write');
        stdoutSpy = sandbox.spy(process.stdout, 'write');
        (0, logsink_1.clear)();
    });
    afterEach(function () {
        sandbox.restore();
    });
    after(function () {
        process.env._FORCE_LOGS = forceLogs;
    });
    const errorMsg = 'some error';
    const warnMsg = 'some warning';
    const debugMsg = 'some debug';
    function doLogging() {
        log.error(errorMsg);
        log.warn(warnMsg);
        log.debug(debugMsg);
    }
    it('should send error, info and debug when loglevel is debug', async function () {
        await (0, logsink_1.init)({ loglevel: 'debug' });
        doLogging();
        (0, chai_1.expect)(stderrSpy.callCount).to.equal(1);
        (0, chai_1.expect)(stderrSpy.args[0][0]).to.include(errorMsg);
        (0, chai_1.expect)(stdoutSpy.callCount).to.equal(2);
        (0, chai_1.expect)(stdoutSpy.args[0][0]).to.include(warnMsg);
        (0, chai_1.expect)(stdoutSpy.args[1][0]).to.include(debugMsg);
    });
    it('should send error and info when loglevel is info', async function () {
        await (0, logsink_1.init)({ loglevel: 'info' });
        doLogging();
        (0, chai_1.expect)(stderrSpy.callCount).to.equal(1);
        (0, chai_1.expect)(stderrSpy.args[0][0]).to.include(errorMsg);
        (0, chai_1.expect)(stdoutSpy.callCount).to.equal(1);
        (0, chai_1.expect)(stdoutSpy.args[0][0]).to.include(warnMsg);
    });
    it('should send error when loglevel is error', async function () {
        await (0, logsink_1.init)({ loglevel: 'error' });
        doLogging();
        (0, chai_1.expect)(stderrSpy.callCount).to.equal(1);
        (0, chai_1.expect)(stderrSpy.args[0][0]).to.include(errorMsg);
        (0, chai_1.expect)(stdoutSpy.callCount).to.equal(0);
    });
});
//# sourceMappingURL=logger.spec.js.map