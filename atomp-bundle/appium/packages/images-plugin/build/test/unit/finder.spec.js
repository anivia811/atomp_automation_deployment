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
const support_1 = require("appium/support");
const driver_1 = require("appium/driver");
const plugin_1 = require("../../lib/plugin");
const constants_1 = require("../../lib/constants");
const finder_1 = require("../../lib/finder");
const image_element_1 = require("../../lib/image-element");
const sinon_1 = require("sinon");
const index_cjs_1 = require("../fixtures/index.cjs");
const sharp_1 = __importDefault(require("sharp"));
const compareModule = __importStar(require("../../lib/compare"));
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
(0, chai_1.use)(chai_as_promised_1.default);
const plugin = new plugin_1.ImageElementPlugin('test');
class PluginDriver extends driver_1.BaseDriver {
    constructor() {
        super({});
    }
    async getWindowRect() { }
    async getScreenshot() { }
    findElement(strategy, selector) {
        return plugin.findElement(async () => { }, this, strategy, selector);
    }
    findElements(strategy, selector) {
        return plugin.findElements(async () => { }, this, strategy, selector);
    }
}
describe('finding elements by image', function () {
    let sandbox;
    beforeEach(function () {
        sandbox = (0, sinon_1.createSandbox)();
    });
    afterEach(function () {
        sandbox.restore();
    });
    describe('findElement', function () {
        it('should use a different special method to find element by image', async function () {
            const d = new PluginDriver();
            sandbox.stub(plugin.finder, 'findByImage').returns(true);
            sandbox.stub(d, 'findElOrElsWithProcessing').returns(false);
            await (0, chai_1.expect)(d.findElement(constants_1.IMAGE_STRATEGY, 'foo')).to.eventually.be.true;
            await (0, chai_1.expect)(d.findElements(constants_1.IMAGE_STRATEGY, 'foo')).to.eventually.be.true;
        });
        it('should not be able to find image element from any other element', async function () {
            const d = new PluginDriver();
            await (0, chai_1.expect)(d.findElementFromElement(constants_1.IMAGE_STRATEGY, 'foo', 'elId')).to.be.rejectedWith(/Locator Strategy.+is not supported/);
            await (0, chai_1.expect)(d.findElementsFromElement(constants_1.IMAGE_STRATEGY, 'foo', 'elId')).to.be.rejectedWith(/Locator Strategy.+is not supported/);
        });
    });
    describe('findByImage', function () {
        const rect = { x: 10, y: 20, width: 30, height: 40 };
        const score = 0.9;
        const size = { width: 100, height: 200 };
        const screenshot = Buffer.from('iVBORfoo', 'base64');
        const template = Buffer.from('iVBORbar', 'base64');
        let d;
        let f;
        let compareStub;
        function basicStub(driver, finder) {
            const rectStub = sandbox.stub(driver, 'getWindowRect').returns({
                x: 0,
                y: 0,
                ...size,
            });
            const screenStub = sandbox
                .stub(finder, 'getScreenshotForImageFind')
                .returns({ screenshot });
            return { rectStub, screenStub };
        }
        function basicImgElVerify(imgElProto, finder) {
            const imgElId = support_1.util.unwrapElement(imgElProto);
            const imgEl = finder.getImageElement(imgElId);
            (0, chai_1.expect)(imgEl).to.be.instanceOf(image_element_1.ImageElement);
            (0, chai_1.expect)(imgEl.rect).to.eql(rect);
            (0, chai_1.expect)(imgEl.score).to.eql(score);
            return imgEl;
        }
        beforeEach(function () {
            d = new PluginDriver();
            f = new finder_1.ImageElementFinder();
            compareStub = sandbox.stub(compareModule, 'compareImages');
            compareStub.resolves({ rect, score });
            basicStub(d, f);
        });
        it('should find an image element happypath', async function () {
            const imgElProto = await f.findByImage(template, d, { multiple: false });
            basicImgElVerify(imgElProto, f);
        });
        it('should find image elements happypath', async function () {
            compareStub.resolves([{ rect, score }]);
            const els = await f.findByImage(template, d, { multiple: true });
            (0, chai_1.expect)(els).to.be.an('array').with.length(1);
            basicImgElVerify(els[0], f);
        });
        it('should fail if driver does not support getWindowRect', async function () {
            d.getWindowRect = null;
            await (0, chai_1.expect)(f.findByImage(template, d, { multiple: false })).to.eventually.be.rejectedWith(/driver does not support/);
        });
        it('should fix template size if requested', async function () {
            const newTemplate = 'iVBORbaz';
            const newTemplateBuf = Buffer.from(newTemplate, 'base64');
            await d.settings.update({ fixImageTemplateSize: true });
            sandbox.stub(f, 'ensureTemplateSize').resolves(newTemplateBuf);
            const imgElProto = await f.findByImage(template, d, { multiple: false });
            const imgEl = basicImgElVerify(imgElProto, f);
            (0, chai_1.expect)(imgEl.originalImage).to.eql(newTemplate);
            (0, chai_1.expect)(compareStub.lastCall.args[2]).to.eql(newTemplateBuf);
        });
        it('should fix template size scale if requested', async function () {
            const newTemplate = 'iVBORbaz';
            const newTemplateBuf = Buffer.from(newTemplate, 'base64');
            await d.settings.update({ fixImageTemplateScale: true });
            sandbox.stub(f, 'fixImageTemplateScale').resolves(newTemplateBuf);
            const imgElProto = await f.findByImage(template, d, { multiple: false });
            const imgEl = basicImgElVerify(imgElProto, f);
            (0, chai_1.expect)(imgEl.originalImage).to.eql(newTemplate);
            (0, chai_1.expect)(compareStub.lastCall.args[2]).to.eql(newTemplateBuf);
        });
        it('should not fix template size scale if it is not requested', async function () {
            await d.settings.update({});
            // fixImageTemplateScale is always called, but should return the original template
            // when scaling is not requested. We verify this by checking the compareImages call
            // receives the original template, not a modified one.
            const imgElProto = await f.findByImage(template, d, { multiple: false });
            basicImgElVerify(imgElProto, f);
            // The template passed to compareImages should be the original (or same buffer reference)
            // when fixImageTemplateScale is not requested
            (0, chai_1.expect)(compareStub.called).to.be.true;
            const lastCallArgs = compareStub.lastCall?.args;
            (0, chai_1.expect)(lastCallArgs[2]).to.eql(template);
        });
        it('should throw an error if template match fails', async function () {
            compareStub.rejects(new Error('Cannot find any occurrences'));
            await (0, chai_1.expect)(f.findByImage(template, d, { multiple: false })).to.be.rejectedWith(/element could not be located/);
        });
        it('should return empty array for multiple elements if template match fails', async function () {
            compareStub.rejects(new Error('Cannot find any occurrences'));
            await (0, chai_1.expect)(f.findByImage(template, d, { multiple: true })).to.eventually.eql([]);
        });
        it('should respect implicit wait', async function () {
            d.setImplicitWait(10);
            compareStub.resetHistory();
            compareStub.returns({ rect, score });
            compareStub.onFirstCall().throws(new Error('Cannot find any occurrences'));
            const imgElProto = await f.findByImage(template, d, { multiple: false });
            basicImgElVerify(imgElProto, f);
            (0, chai_1.expect)(compareStub.calledTwice).to.be.true;
        });
        it('should not add element to cache and return it directly when checking staleness', async function () {
            const imgEl = (await f.findByImage(template, d, {
                multiple: false,
                shouldCheckStaleness: true,
            }));
            (0, chai_1.expect)(imgEl).to.be.instanceOf(image_element_1.ImageElement);
            (0, chai_1.expect)(f.getImageElement(imgEl.id)).to.be.undefined;
            (0, chai_1.expect)(imgEl.rect).to.eql(rect);
        });
    });
    describe('fixImageTemplateScale', function () {
        let f;
        const basicTemplate = 'iVBORbaz';
        const basicTemplateBuf = Buffer.from(basicTemplate, 'base64');
        beforeEach(function () {
            f = new finder_1.ImageElementFinder();
        });
        it('should not fix template size scale if no scale value', async function () {
            await (0, chai_1.expect)(f.fixImageTemplateScale(basicTemplateBuf, { fixImageTemplateScale: true })).to.eventually.eql(basicTemplateBuf);
        });
        it('should not fix template size scale if it is null', async function () {
            await (0, chai_1.expect)(f.fixImageTemplateScale(basicTemplateBuf, null)).to.eventually.eql(basicTemplateBuf);
        });
        it('should not fix template size scale if it is not number', async function () {
            await (0, chai_1.expect)(f.fixImageTemplateScale(basicTemplateBuf, 'wrong-scale')).to.eventually.eql(basicTemplateBuf);
        });
        it('should fix template size scale', async function () {
            await (0, chai_1.expect)(f.fixImageTemplateScale(index_cjs_1.TiNY_PNG_BUF, {
                fixImageTemplateScale: true,
                xScale: 1.5,
                yScale: 1.5,
            })).to.eventually.not.eql(index_cjs_1.TiNY_PNG_BUF);
        });
        it('should not fix template size scale because of fixImageTemplateScale being false', async function () {
            await (0, chai_1.expect)(f.fixImageTemplateScale(index_cjs_1.TiNY_PNG_BUF, {
                fixImageTemplateScale: false,
                xScale: 1.5,
                yScale: 1.5,
            })).to.eventually.eql(index_cjs_1.TiNY_PNG_BUF);
        });
        it('should fix template size scale with default scale', async function () {
            await (0, chai_1.expect)(f.fixImageTemplateScale(index_cjs_1.TiNY_PNG_BUF, {
                defaultImageTemplateScale: 4.0,
            })).to.eventually.not.eql(index_cjs_1.TiNY_PNG_BUF);
        });
        it('should fix template size scale with default scale and image scale', async function () {
            await (0, chai_1.expect)(f.fixImageTemplateScale(index_cjs_1.TiNY_PNG_BUF, {
                defaultImageTemplateScale: 4.0,
                fixImageTemplateScale: true,
                xScale: 1.5,
                yScale: 1.5,
            })).to.eventually.not.eql(index_cjs_1.TiNY_PNG_BUF);
        });
        it('should not fix template size scale with default scale and image scale', async function () {
            await (0, chai_1.expect)(f.fixImageTemplateScale(index_cjs_1.TiNY_PNG_BUF, {
                defaultImageTemplateScale: 4.0,
                fixImageTemplateScale: false,
                xScale: 1.5,
                yScale: 1.5,
            })).to.eventually.not.eql(index_cjs_1.TiNY_PNG_BUF);
        });
        it('should not fix template size scale because of ignoreDefaultImageTemplateScale', async function () {
            await (0, chai_1.expect)(f.fixImageTemplateScale(index_cjs_1.TiNY_PNG_BUF, {
                defaultImageTemplateScale: 4.0,
                ignoreDefaultImageTemplateScale: true,
            })).to.eventually.eql(index_cjs_1.TiNY_PNG_BUF);
        });
        it('should ignore defaultImageTemplateScale to fix template size scale because of ignoreDefaultImageTemplateScale', async function () {
            await (0, chai_1.expect)(f.fixImageTemplateScale(index_cjs_1.TiNY_PNG_BUF, {
                defaultImageTemplateScale: 4.0,
                ignoreDefaultImageTemplateScale: true,
                fixImageTemplateScale: true,
                xScale: 1.5,
                yScale: 1.5,
            })).to.eventually.not.eql(index_cjs_1.TiNY_PNG_BUF);
        });
    });
    describe('ensureTemplateSize', function () {
        const f = new finder_1.ImageElementFinder();
        it('should not resize the template if it is smaller than the screen', async function () {
            const [width, height] = index_cjs_1.TINY_PNG_DIMS.map((n) => n * 2);
            await (0, chai_1.expect)(f.ensureTemplateSize(index_cjs_1.TiNY_PNG_BUF, { width, height })).to.eventually.eql(index_cjs_1.TiNY_PNG_BUF);
        });
        it('should not resize the template if it is the same size as the screen', async function () {
            const [width, height] = index_cjs_1.TINY_PNG_DIMS;
            await (0, chai_1.expect)(f.ensureTemplateSize(index_cjs_1.TiNY_PNG_BUF, { width, height })).to.eventually.eql(index_cjs_1.TiNY_PNG_BUF);
        });
        it('should resize the template if it is bigger than the screen', async function () {
            const [width, height] = index_cjs_1.TINY_PNG_DIMS.map((n) => n / 2);
            const newTemplateBuf = await f.ensureTemplateSize(index_cjs_1.TiNY_PNG_BUF, { width, height });
            (0, chai_1.expect)(newTemplateBuf).to.not.eql(index_cjs_1.TiNY_PNG_BUF);
            (0, chai_1.expect)(newTemplateBuf.length).to.be.below(index_cjs_1.TiNY_PNG_BUF.length);
        });
    });
    describe('getScreenshotForImageFind', function () {
        let d;
        let f;
        beforeEach(function () {
            d = new PluginDriver();
            f = new finder_1.ImageElementFinder();
            sandbox.stub(d, 'getScreenshot').resolves(index_cjs_1.TINY_PNG);
        });
        it('should fail if driver does not support getScreenshot', async function () {
            await (0, chai_1.expect)(new finder_1.ImageElementFinder().getScreenshotForImageFind(new driver_1.BaseDriver({}), { width: 100, height: 100 })).to.eventually.be.rejectedWith(/driver does not support/);
        });
        it('should not adjust or verify screenshot if asked not to by settings', async function () {
            await d.settings.update({ fixImageFindScreenshotDims: false });
            const [width, height] = index_cjs_1.TINY_PNG_DIMS.map((n) => n + 1);
            const { screenshot, scale } = await f.getScreenshotForImageFind(d, { width, height });
            (0, chai_1.expect)(screenshot).to.eql(index_cjs_1.TiNY_PNG_BUF);
            (0, chai_1.expect)(scale).to.equal(undefined);
        });
        it('should return screenshot without adjustment if it matches screen size', async function () {
            const [width, height] = index_cjs_1.TINY_PNG_DIMS;
            const { screenshot, scale } = await f.getScreenshotForImageFind(d, { width, height });
            (0, chai_1.expect)(screenshot).to.eql(index_cjs_1.TiNY_PNG_BUF);
            (0, chai_1.expect)(scale).to.equal(undefined);
        });
        it('should return scaled screenshot with same aspect ratio if matching screen aspect ratio', async function () {
            const [width, height] = index_cjs_1.TINY_PNG_DIMS.map((n) => n * 1.5);
            const { screenshot, scale } = await f.getScreenshotForImageFind(d, { width, height });
            (0, chai_1.expect)(screenshot).to.not.eql(index_cjs_1.TiNY_PNG_BUF);
            const screenshotObj = (0, sharp_1.default)(screenshot);
            const { width: screenWidth, height: screenHeight } = await screenshotObj.metadata();
            (0, chai_1.expect)(screenWidth).to.eql(width);
            (0, chai_1.expect)(screenHeight).to.eql(height);
            (0, chai_1.expect)(scale).to.eql({ xScale: 1.5, yScale: 1.5 });
        });
        it('should return scaled screenshot with different aspect ratio if not matching screen aspect ratio', async function () {
            // try first with portrait screen, screen = 8 x 12
            let [width, height] = [index_cjs_1.TINY_PNG_DIMS[0] * 2, index_cjs_1.TINY_PNG_DIMS[1] * 3];
            let expectedScale = { xScale: 2.67, yScale: 4 };
            const { screenshot, scale } = await f.getScreenshotForImageFind(d, { width, height });
            (0, chai_1.expect)(screenshot).to.not.eql(index_cjs_1.TiNY_PNG_BUF);
            let screenshotObj = (0, sharp_1.default)(screenshot);
            let { width: screenWidth, height: screenHeight } = await screenshotObj.metadata();
            (0, chai_1.expect)(screenWidth).to.eql(width);
            (0, chai_1.expect)(screenHeight).to.eql(height);
            (0, chai_1.expect)(scale.xScale.toFixed(2)).to.eql(expectedScale.xScale.toString());
            (0, chai_1.expect)(scale.yScale).to.eql(expectedScale.yScale);
            // then with landscape screen, screen = 12 x 8
            [width, height] = [index_cjs_1.TINY_PNG_DIMS[0] * 3, index_cjs_1.TINY_PNG_DIMS[1] * 2];
            expectedScale = { xScale: 4, yScale: 2.67 };
            const { screenshot: newScreen, scale: newScale } = await f.getScreenshotForImageFind(d, { width, height });
            (0, chai_1.expect)(newScreen).to.not.eql(index_cjs_1.TiNY_PNG_BUF);
            screenshotObj = (0, sharp_1.default)(newScreen);
            ({ width: screenWidth, height: screenHeight } = await screenshotObj.metadata());
            (0, chai_1.expect)(screenWidth).to.eql(width);
            (0, chai_1.expect)(screenHeight).to.eql(height);
            (0, chai_1.expect)(newScale.xScale).to.eql(expectedScale.xScale);
            (0, chai_1.expect)(newScale.yScale.toFixed(2)).to.eql(expectedScale.yScale.toString());
        });
        it('should return scaled screenshot with different aspect ratio if not matching screen aspect ratio with fixImageTemplateScale', async function () {
            // try first with portrait screen, screen = 8 x 12
            let [width, height] = [index_cjs_1.TINY_PNG_DIMS[0] * 2, index_cjs_1.TINY_PNG_DIMS[1] * 3];
            let expectedScale = { xScale: 2.67, yScale: 4 };
            const { screenshot, scale } = await f.getScreenshotForImageFind(d, { width, height });
            (0, chai_1.expect)(screenshot).to.not.eql(index_cjs_1.TiNY_PNG_BUF);
            let screenshotObj = (0, sharp_1.default)(screenshot);
            let { width: screenWidth, height: screenHeight } = await screenshotObj.metadata();
            (0, chai_1.expect)(screenWidth).to.eql(width);
            (0, chai_1.expect)(screenHeight).to.eql(height);
            (0, chai_1.expect)(scale.xScale.toFixed(2)).to.eql(expectedScale.xScale.toString());
            (0, chai_1.expect)(scale.yScale).to.eql(expectedScale.yScale);
            // 8 x 12 stretched TINY_PNG
            await (0, chai_1.expect)(f.fixImageTemplateScale(screenshot, {
                fixImageTemplateScale: true,
                xScale: scale.xScale,
                yScale: scale.yScale,
            })).to.eventually.not.eql(index_cjs_1.TiNY_PNG_BUF);
            // then with landscape screen, screen = 12 x 8
            [width, height] = [index_cjs_1.TINY_PNG_DIMS[0] * 3, index_cjs_1.TINY_PNG_DIMS[1] * 2];
            expectedScale = { xScale: 4, yScale: 2.67 };
            const { screenshot: newScreen, scale: newScale } = await f.getScreenshotForImageFind(d, { width, height });
            (0, chai_1.expect)(newScreen).to.not.eql(index_cjs_1.TiNY_PNG_BUF);
            screenshotObj = (0, sharp_1.default)(newScreen);
            ({ width: screenWidth, height: screenHeight } = await screenshotObj.metadata());
            (0, chai_1.expect)(screenWidth).to.eql(width);
            (0, chai_1.expect)(screenHeight).to.eql(height);
            (0, chai_1.expect)(newScale.xScale).to.eql(expectedScale.xScale);
            (0, chai_1.expect)(newScale.yScale.toFixed(2)).to.eql(expectedScale.yScale.toString());
            // 12 x 8 stretched TINY_PNG
            await (0, chai_1.expect)(f.fixImageTemplateScale(newScreen, {
                fixImageTemplateScale: true,
                xScale: newScale.xScale,
                yScale: newScale.yScale,
            })).to.eventually.not.eql(index_cjs_1.TiNY_PNG_BUF);
        });
    });
});
//# sourceMappingURL=finder.spec.js.map