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
exports.findElementTests = findElementTests;
const chai_1 = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const helpers_1 = require("../helpers");
chai_1.default.use(chai_as_promised_1.default);
function findElementTests() {
    describe('finding elements', function () {
        let driver;
        before(async function () {
            driver = await (0, helpers_1.initSession)(helpers_1.W3C_PREFIXED_CAPS);
        });
        after(async function () {
            return await (0, helpers_1.deleteSession)(driver);
        });
        describe('by XPath', function () {
            it('should find a single element by xpath', async function () {
                (0, chai_1.expect)(await driver.$('//MockWebView')).to.not.be.empty;
            });
            it('should not find a single element that is not there', async function () {
                (0, chai_1.expect)((await driver.$$('//dontexist')).length).to.equal(0);
            });
            it('should find multiple elements', async function () {
                (0, chai_1.expect)((await driver.$$('//MockListItem')).length).to.equal(3);
            });
        });
        describe('by classname', function () {
            it('should find a single element by class', async function () {
                (0, chai_1.expect)(await driver.$('.MockWebView')).to.not.be.empty;
            });
            it('should not find a single element by class that is not there', async function () {
                (0, chai_1.expect)((await driver.$$('.dontexist')).length).to.equal(0);
            });
        });
        describe('using bad selectors', function () {
            it('should not find a single element with bad selector', async function () {
                try {
                    await driver.$('badsel');
                }
                catch (e) {
                    (0, chai_1.expect)(e).to.be.an('error');
                    (0, chai_1.expect)(e.message).to.include('invalid selector');
                    return;
                }
                chai_1.expect.fail('should have thrown');
            });
            it('should not find multiple elements with bad selector', async function () {
                try {
                    await driver.$$('badsel');
                }
                catch (e) {
                    (0, chai_1.expect)(e).to.be.an('error');
                    (0, chai_1.expect)(e.message).to.include('invalid selector');
                    return;
                }
                chai_1.expect.fail('should have thrown');
            });
        });
        describe('via element selectors', function () {
            it('should find an element from another element', async function () {
                const el = await driver.$('#1');
                const title = await el.$('title');
                const earlierTitle = await driver.$('title');
                (0, chai_1.expect)(await earlierTitle.isEqual(title)).to.equal(false);
            });
            it('should find multiple elements from another element', async function () {
                const el = await driver.$('html');
                (0, chai_1.expect)((await el.$$('title')).length).to.equal(2);
            });
            it(`should not find multiple elements that don't exist from another element`, async function () {
                const el = await driver.$('#1');
                (0, chai_1.expect)((await el.$$('marquee')).length).to.equal(0);
            });
            it('should not find elements if root element does not exist', async function () {
                const el = await driver.$('#blub');
                await (0, chai_1.expect)(el.$('body')).to.be.rejectedWith(/Can't call \$/);
            });
        });
    });
}
//# sourceMappingURL=find-element-tests.js.map