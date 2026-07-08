"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertTests = alertTests;
const chai_1 = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const helpers_1 = require("../helpers");
chai_1.default.use(chai_as_promised_1.default);
function alertTests() {
    describe('alerts', function () {
        let driver;
        before(async function () {
            driver = await (0, helpers_1.initSession)(helpers_1.W3C_PREFIXED_CAPS);
        });
        after(async function () {
            return await (0, helpers_1.deleteSession)(driver);
        });
        const noAlertMessage = 'modal dialog when one was not open';
        const noAlertCases = [
            ['getAlertText', () => driver.getAlertText()],
            ['sendAlertText', () => driver.sendAlertText('foo')],
            ['acceptAlert', () => driver.acceptAlert()],
            ['dismissAlert', () => driver.dismissAlert()],
        ];
        for (const [name, fn] of noAlertCases) {
            it(`should reject ${name} when no alert is present`, async function () {
                const e = await fn().catch((err) => err);
                (0, chai_1.expect)(e).to.be.an('error');
                (0, chai_1.expect)(e.message).to.include(noAlertMessage);
            });
        }
        it('should get text of an alert', async function () {
            await (await driver.$('#AlertButton')).click();
            (0, chai_1.expect)(await driver.getAlertText()).to.equal('Fake Alert');
        });
        it('should set the text of an alert', async function () {
            await driver.sendAlertText('foo');
            (0, chai_1.expect)(await driver.getAlertText()).to.equal('foo');
        });
        it('should not do other things while an alert is there', async function () {
            try {
                await (await driver.$('#AlertButton')).click();
                await (await driver.$('#nav')).click();
                this.fail('should have thrown an error');
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.an('error');
                (0, chai_1.expect)(err.message).to.include('modal dialog was open, blocking this operation');
            }
        });
        it.skip('should accept an alert', function () {
            driver.acceptAlert().$('nav').click().nodeify();
        });
        it.skip('should not set the text of the wrong kind of alert', function () {
            driver.$('AlertButton2').click().alertText().nodeify();
        });
        it.skip('should dismiss an alert', function () {
            driver.acceptAlert().$('nav').click().nodeify();
        });
    });
}
//# sourceMappingURL=alert-tests.js.map