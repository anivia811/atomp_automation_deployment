"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const support_1 = require("@appium/support");
const node_path_1 = __importDefault(require("node:path"));
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const constants_1 = require("../../lib/constants");
const helpers_1 = require("../helpers");
const e2e_helpers_1 = require("./e2e-helpers");
const { expect } = chai_1.default;
chai_1.default.use(chai_as_promised_1.default);
describe('CLI behavior controlled by schema', function () {
    let appiumHome;
    before(async function () {
        appiumHome = await support_1.tempDir.openDir();
    });
    after(async function () {
        await support_1.fs.rimraf(appiumHome);
    });
    describe('keyword', function () {
        let help;
        before(async function () {
            await (0, e2e_helpers_1.installLocalExtension)(appiumHome, constants_1.DRIVER_TYPE, node_path_1.default.dirname((0, helpers_1.resolveFixture)('test-driver/package.json')));
            help = await (0, e2e_helpers_1.runAppium)(appiumHome, ['server', '--help']);
        });
        describe('appiumCliIgnored', function () {
            it('should still support arguments without this keyword', function () {
                expect(help).to.match(/oliver-boliver/);
            });
            it('should cause the argument to be suppressed', function () {
                expect(help).not.to.match(/mcmonkey-mcbean/);
            });
        });
        describe('appiumDeprecated', function () {
            it.skip('should mark the argument as deprecated', function () {
                expect(help).to.match(/\[DEPRECATED\] funkytelechy/);
            });
        });
    });
});
//# sourceMappingURL=schema.e2e.spec.js.map