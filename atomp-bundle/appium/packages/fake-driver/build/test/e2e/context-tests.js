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
exports.contextTests = contextTests;
const chai_1 = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const helpers_1 = require("../helpers");
chai_1.default.use(chai_as_promised_1.default);
function contextTests() {
    describe('contexts, webviews, frames', function () {
        let driver;
        before(async function () {
            driver = await (0, helpers_1.initSession)(helpers_1.W3C_PREFIXED_CAPS);
        });
        after(async function () {
            return await (0, helpers_1.deleteSession)(driver);
        });
        it('should get current context', async function () {
            await (0, chai_1.expect)(driver.getContext()).to.eventually.become('NATIVE_APP');
        });
        it('should get contexts', async function () {
            await (0, chai_1.expect)(driver.getContexts()).to.eventually.become(['NATIVE_APP', 'PROXY', 'WEBVIEW_1']);
        });
        it('should not set context that is not there', async function () {
            await (0, chai_1.expect)(driver.switchContext('WEBVIEW_FOO')).to.be.rejectedWith(/No such context found/);
        });
        it('should set context', async function () {
            await driver.switchContext('WEBVIEW_1');
            await (0, chai_1.expect)(driver.getContext()).to.eventually.become('WEBVIEW_1');
        });
        it('should find webview elements in a webview', async function () {
            await (0, chai_1.expect)((await driver.$('//*')).getTagName()).to.eventually.become('html');
        });
        it('should not switch to a frame that is not there', async function () {
            await (0, chai_1.expect)(driver.switchToFrame(2)).to.be.rejectedWith(/frame could not be found/);
        });
        it('should switch to an iframe', async function () {
            await driver.switchToFrame(1);
            await (0, chai_1.expect)(driver.getTitle()).to.eventually.become('Test iFrame');
        });
        it('should switch back to default frame', async function () {
            await driver.switchToFrame(null);
            await (0, chai_1.expect)(driver.getTitle()).to.eventually.become('Test Webview');
        });
        it('should go back to native context', async function () {
            await driver.switchContext('NATIVE_APP');
            await (0, chai_1.expect)((await driver.$('//*')).getTagName()).to.eventually.become('AppiumAUT');
        });
        it('should not set a frame in a native context', async function () {
            await driver.switchContext('NATIVE_APP');
            await (0, chai_1.expect)(driver.switchToFrame(1)).to.be.rejectedWith(/could not be executed in the current context/);
        });
    });
}
//# sourceMappingURL=context-tests.js.map