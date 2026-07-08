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
exports.elementTests = elementTests;
const chai_1 = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const helpers_1 = require("../helpers");
chai_1.default.use(chai_as_promised_1.default);
function elementTests() {
    describe('element interaction and introspection', function () {
        let driver;
        before(async function () {
            driver = await (0, helpers_1.initSession)(helpers_1.W3C_PREFIXED_CAPS);
        });
        after(async function () {
            return await (0, helpers_1.deleteSession)(driver);
        });
        it('should not set value on an invalid element', async function () {
            const el = await driver.$('//MockListItem');
            await (0, chai_1.expect)(el.setValue('test value')).to.be.rejectedWith(/invalid state/);
        });
        it('should set value on an element and retrieve text', async function () {
            const el = await driver.$('//MockInputField');
            await el.setValue('test value');
            (0, chai_1.expect)(await el.getText()).to.equal('test value');
        });
        it('should not clear an invalid element', async function () {
            await (0, chai_1.expect)((await driver.$('//MockListItem')).clearValue()).to.be.rejectedWith(/invalid state/);
        });
        it('should clear an element', async function () {
            const el = await driver.$('//MockInputField');
            await el.setValue('test value');
            (0, chai_1.expect)(await el.getText()).to.not.equal('');
            await el.clearValue();
            (0, chai_1.expect)(await el.getText()).to.equal('');
        });
        it('should not click an invisible element', async function () {
            await (0, chai_1.expect)((await driver.$('#Button1')).click()).to.be.rejectedWith(/invalid state/);
        });
        it('should click an element and get its attributes', async function () {
            const el = await driver.$('#Button2');
            await el.click();
            await el.click();
            await el.click();
            (0, chai_1.expect)(await el.getAttribute('clicks')).to.equal('3');
        });
        it('should get the name of an element', async function () {
            let el = await driver.$('MockInputField');
            (0, chai_1.expect)(await el.getTagName()).to.equal('MockInputField');
            el = await driver.$('#wv');
            (0, chai_1.expect)(await el.getTagName()).to.equal('MockWebView');
        });
        it('should detect whether an element is displayed', async function () {
            (0, chai_1.expect)(await (await driver.$('#Button1')).isDisplayed()).to.be.false;
            (0, chai_1.expect)(await (await driver.$('#Button2')).isDisplayed()).to.be.true;
        });
        it('should detect whether an element is enabled', async function () {
            (0, chai_1.expect)(await (await driver.$('#Button1')).isEnabled()).to.be.false;
            (0, chai_1.expect)(await (await driver.$('#Button2')).isEnabled()).to.be.true;
        });
        it('should detect whether an element is selected', async function () {
            (0, chai_1.expect)(await (await driver.$('#Button1')).isSelected()).to.be.false;
            (0, chai_1.expect)(await (await driver.$('#Button2')).isSelected()).to.be.true;
        });
        it('should get the rect of an element', async function () {
            const navEl = await driver.$('#nav');
            const elementId = await navEl.elementId;
            (0, chai_1.expect)(await driver.getElementRect(elementId)).to.eql({
                x: 1,
                y: 1,
                width: 100,
                height: 100,
            });
        });
        it('should get the rect of an element with float vals', async function () {
            const lvEl = await driver.$('#lv');
            const elementId = await lvEl.elementId;
            (0, chai_1.expect)(await driver.getElementRect(elementId)).to.eql({
                x: 20.8,
                y: 15.3,
                height: 2,
                width: 30.5,
            });
        });
        it('should determine element equality', async function () {
            const el1 = await driver.$('#wv');
            const el2 = await driver.$('#wv');
            (0, chai_1.expect)(await el1.isEqual(el2)).to.equal(true);
        });
        it('should determine element inequality', async function () {
            const el1 = await driver.$('#wv');
            const el2 = await driver.$('#lv');
            (0, chai_1.expect)(await el1.isEqual(el2)).to.equal(false);
        });
        it('should not get the css property of an element when not in a webview', async function () {
            const btnEl = await driver.$('#Button1');
            const elementId = await btnEl.elementId;
            const e = await driver.getElementCSSValue(elementId, 'height').catch((err) => err);
            (0, chai_1.expect)(e).to.be.an('error');
            (0, chai_1.expect)(e.message).to.include('could not be executed');
        });
        it('should get the css property of an element when in a webview', async function () {
            await driver.switchContext('WEBVIEW_1');
            const bodyEl = await driver.$('body');
            const elementId = await bodyEl.elementId;
            (0, chai_1.expect)(await driver.getElementCSSValue(elementId, 'background-color')).to.equal('#000');
        });
        it('should return empty string for an unspecified css property', async function () {
            const bodyEl = await driver.$('body');
            const elementId = await bodyEl.elementId;
            (0, chai_1.expect)(await driver.getElementCSSValue(elementId, 'font-size')).to.equal('');
        });
    });
}
//# sourceMappingURL=element-interaction-tests.js.map