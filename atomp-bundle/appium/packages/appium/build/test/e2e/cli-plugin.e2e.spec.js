"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const support_1 = require("@appium/support");
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const constants_1 = require("../../lib/constants");
const helpers_1 = require("../helpers");
const e2e_helpers_1 = require("./e2e-helpers");
const { expect } = chai_1.default;
chai_1.default.use(chai_as_promised_1.default);
describe('Plugin CLI', function () {
    let appiumHome;
    let runRun;
    before(async function () {
        appiumHome = await support_1.tempDir.openDir();
        const run = (0, e2e_helpers_1.runAppiumJson)(appiumHome);
        runRun = (args) => run([constants_1.PLUGIN_TYPE, constants_1.EXT_SUBCOMMAND_RUN, ...args]);
    });
    after(async function () {
        await support_1.fs.rimraf(appiumHome);
    });
    describe('run', function () {
        before(async function () {
            await (0, e2e_helpers_1.installLocalExtension)(appiumHome, constants_1.PLUGIN_TYPE, helpers_1.FAKE_PLUGIN_DIR);
        });
        it('should run a valid plugin, valid script, and result in success', async function () {
            const pluginName = 'fake';
            const scriptName = 'fake-success';
            const out = await runRun([pluginName, scriptName, '--json']);
            expect(out).to.not.have.property('error');
        });
        it('should run a valid plugin, valid error prone script, and throw error', async function () {
            const pluginName = 'fake';
            await expect(runRun([pluginName, 'fake-error', '--json'])).to.be.rejectedWith(Error);
        });
        it('should take a valid plugin, invalid script, and throw an error', async function () {
            const pluginName = 'fake';
            await expect(runRun([pluginName, 'foo', '--json'])).to.be.rejectedWith(Error);
        });
        it('should take an invalid plugin, invalid script, and throw an error', async function () {
            await expect(runRun(['foo', 'bar', '--json'])).to.be.rejectedWith(Error);
        });
    });
});
//# sourceMappingURL=cli-plugin.e2e.spec.js.map