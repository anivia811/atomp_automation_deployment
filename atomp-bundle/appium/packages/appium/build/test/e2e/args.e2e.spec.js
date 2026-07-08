"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const support_1 = require("@appium/support");
const teen_process_1 = require("teen_process");
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const e2e_helpers_1 = require("./e2e-helpers");
const helpers_1 = require("../helpers");
const logsink_1 = require("../../lib/logsink");
const { expect } = chai_1.default;
chai_1.default.use(chai_as_promised_1.default);
describe('argument parsing', function () {
    let appiumHome;
    before(async function () {
        appiumHome = await support_1.tempDir.openDir();
    });
    after(async function () {
        await support_1.fs.rimraf(appiumHome);
    });
    describe('when the user provides a very long string for an arg accepting a blob or filename', function () {
        describe('when the very long string is a JSON blob', function () {
            it('should not throw an ENAMETOOLONG exception', async function () {
                this.timeout(10000);
                const capsArg = JSON.stringify({
                    'appium:platformName': 'ANDROID',
                    'appium:platformVersion': '11',
                    'appium:deviceName': 'Spicy jalapeno bacon ipsum dolor amet deserunt tempor pork belly aliqua drumstick, occaecat dolor venison et labore. Rump meatball pork chop tail. Consequat adipisicing kielbasa occaecat laborum pig. Qui pork chop chicken nostrud boudin fugiat. Proident ut culpa, chuck nulla sunt pastrami ut tri-tip. Buffalo dolore adipisicing, labore venison elit beef fatback kevin burgdoggen tail pancetta filet mignon. Dolor turducken rump, anim kevin sunt exercitation ham filet mignon beef ribs ad officia eiusmod id cillum.',
                });
                await expect((0, teen_process_1.exec)(process.execPath, [
                    e2e_helpers_1.EXECUTABLE,
                    '-pa=/wd/hub',
                    '--session-override',
                    '--local-timezone',
                    '--relaxed-security',
                    `--default-capabilities=${capsArg}`,
                    '--port',
                    String(await (0, helpers_1.getTestPort)()),
                ], {
                    env: { APPIUM_HOME: appiumHome, PATH: process.env.PATH },
                    cwd: helpers_1.APPIUM_ROOT,
                    timeout: 5000,
                })).to.be.rejectedWith(Error, /timed out/);
            });
        });
    });
    describe('when the user provides an string where a number was expected', function () {
        describe('when color output is supported', function () {
            it('should output a fancy error message', async function () {
                const result = await (0, e2e_helpers_1.runAppiumRaw)(appiumHome, ['--port=sheep'], {
                    env: { FORCE_COLOR: '1' },
                });
                const actual = 'stderr' in result ? result.stderr : '';
                expect((0, logsink_1.stripColorCodes)(actual)).to.not.equal(actual);
            });
        });
        describe('when color output is unsupported', function () {
            it('should output a colorless yet fancy error message', async function () {
                const result = await (0, e2e_helpers_1.runAppiumRaw)(appiumHome, ['--port=sheep'], {});
                const actual = 'stderr' in result ? result.stderr : '';
                expect((0, logsink_1.stripColorCodes)(actual)).to.equal(actual);
            });
        });
    });
    describe('when the user provides a value for a boolean argument', function () {
        it('should output a basic error message', async function () {
            const [runResult, expected] = await Promise.all([
                (0, e2e_helpers_1.runAppiumRaw)(appiumHome, ['--relaxed-security=sheep'], {}),
                (0, e2e_helpers_1.readAppiumArgErrorFixture)('cli/cli-error-output-boolean.txt'),
            ]);
            const actual = 'stderr' in runResult ? runResult.stderr : '';
            expect((0, e2e_helpers_1.formatAppiumArgErrorOutput)(actual)).to.equal(expected);
        });
    });
    describe('when the user provides an unknown argument', function () {
        it('should output a basic error message', async function () {
            const [runResult, expected] = await Promise.all([
                (0, e2e_helpers_1.runAppiumRaw)(appiumHome, ['--pigs=sheep'], {}),
                (0, e2e_helpers_1.readAppiumArgErrorFixture)('cli/cli-error-output-unknown.txt'),
            ]);
            const actual = 'stderr' in runResult ? runResult.stderr : '';
            expect((0, e2e_helpers_1.formatAppiumArgErrorOutput)(actual)).to.equal(expected);
        });
    });
});
//# sourceMappingURL=args.e2e.spec.js.map