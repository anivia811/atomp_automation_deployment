"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon_1 = require("sinon");
const support_1 = require("@appium/support");
const setup_command_1 = require("../../../lib/cli/setup-command");
const chai_1 = require("chai");
describe('SetupCommand', function () {
    let sandbox;
    beforeEach(function () {
        sandbox = (0, sinon_1.createSandbox)();
    });
    afterEach(function () {
        sandbox.restore();
    });
    describe('getPresetDrivers', function () {
        it('for drivers on macOS environment', function () {
            sandbox.stub(support_1.system, 'isMac').returns(true);
            sandbox.stub(support_1.system, 'isWindows').returns(false);
            (0, chai_1.expect)((0, setup_command_1.getPresetDrivers)('mobile')).to.eql(['uiautomator2', 'xcuitest', 'espresso']);
            (0, chai_1.expect)((0, setup_command_1.getPresetDrivers)('browser')).to.eql(['safari', 'gecko', 'chromium']);
            (0, chai_1.expect)((0, setup_command_1.getPresetDrivers)('desktop')).to.eql(['mac2']);
        });
        it('for drivers on Windows environment', function () {
            sandbox.stub(support_1.system, 'isMac').returns(false);
            sandbox.stub(support_1.system, 'isWindows').returns(true);
            (0, chai_1.expect)((0, setup_command_1.getPresetDrivers)('mobile')).to.eql(['uiautomator2', 'espresso']);
            (0, chai_1.expect)((0, setup_command_1.getPresetDrivers)('browser')).to.eql(['gecko', 'chromium']);
            (0, chai_1.expect)((0, setup_command_1.getPresetDrivers)('desktop')).to.eql(['windows']);
        });
        it('for drivers on Linux environment', function () {
            sandbox.stub(support_1.system, 'isMac').returns(false);
            sandbox.stub(support_1.system, 'isWindows').returns(false);
            (0, chai_1.expect)((0, setup_command_1.getPresetDrivers)('mobile')).to.eql(['uiautomator2', 'espresso']);
            (0, chai_1.expect)((0, setup_command_1.getPresetDrivers)('browser')).to.eql(['gecko', 'chromium']);
            (0, chai_1.expect)((0, setup_command_1.getPresetDrivers)('desktop')).to.eql([]);
        });
    });
});
//# sourceMappingURL=setup-command.spec.js.map