"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_1 = require("../../lib/plugin");
const constants_1 = require("../../lib/constants");
const driver_1 = require("appium/driver");
const index_cjs_1 = require("../fixtures/index.cjs");
const support_1 = require("@appium/support");
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
(0, chai_1.use)(chai_as_promised_1.default);
describe('ImageElementPlugin#handle', function () {
    const next = async () => { };
    const driver = new driver_1.BaseDriver({});
    const p = new plugin_1.ImageElementPlugin('test');
    describe('compareImages', function () {
        this.timeout(6000);
        it('should compare images via match features mode', async function () {
            const res = await p.compareImages(next, driver, constants_1.MATCH_FEATURES_MODE, index_cjs_1.TEST_IMG_1_B64, index_cjs_1.TEST_IMG_2_B64, {});
            (0, chai_1.expect)(res).to.have.property('count');
            (0, chai_1.expect)(res.count).to.eql(0);
        });
        it('should compare images via get similarity mode', async function () {
            const res = await p.compareImages(next, driver, constants_1.GET_SIMILARITY_MODE, Buffer.from(index_cjs_1.TEST_IMG_1_B64, 'base64'), Buffer.from(index_cjs_1.TEST_IMG_2_B64, 'base64'), {});
            (0, chai_1.expect)(res).to.have.property('score');
            (0, chai_1.expect)(res.score).to.be.above(0.2);
        });
        it('should compare images via match template mode', async function () {
            const res = await p.compareImages(next, driver, constants_1.MATCH_TEMPLATE_MODE, index_cjs_1.TEST_IMG_1_B64, index_cjs_1.TEST_IMG_2_B64, {});
            (0, chai_1.expect)(res).to.have.property('rect');
            (0, chai_1.expect)(res.rect.height).to.be.above(0);
            (0, chai_1.expect)(res.rect.width).to.be.above(0);
            (0, chai_1.expect)(res.score).to.be.above(0.2);
        });
        it('should throw an error if comparison mode is not supported', async function () {
            await (0, chai_1.expect)(p.compareImages(next, driver, 'some mode', '', '')).to.eventually.be.rejectedWith(/comparison mode is unknown/);
        });
        it('should throw an error if image template is broken', async function () {
            await (0, chai_1.expect)(p.compareImages(next, driver, constants_1.MATCH_TEMPLATE_MODE, Buffer.from('d1423423424'), Buffer.from('d1423423424'))).to.eventually.be.rejected;
        });
        it('should throw an error if image template is empty', async function () {
            await (0, chai_1.expect)(p.compareImages(next, driver, constants_1.MATCH_TEMPLATE_MODE, Buffer.from(''), Buffer.from(''))).to.eventually.be.rejected;
        });
    });
    describe('findElement(s)', function () {
        driver.settings = { getSettings: () => ({}) };
        driver.isW3CProtocol = () => true;
        driver.getScreenshot = () => index_cjs_1.TEST_IMG_2_B64;
        driver.getWindowRect = () => ({ x: 0, y: 0, width: 64, height: 64 });
        it('should defer execution to regular command if not a find command', async function () {
            const next = async () => true;
            await (0, chai_1.expect)(p.handle(next, driver, 'sendKeys')).to.eventually.become(true);
        });
        it('should defer execution to regular command if it is a find command but a different strategy', async function () {
            const next = async () => true;
            await (0, chai_1.expect)(p.findElement(next, driver, 'xpath', '//foo/bar')).to.eventually.become(true);
            await (0, chai_1.expect)(p.findElements(next, driver, 'xpath', '//foo/bar')).to.eventually.become(true);
        });
        it('should find an image element inside a screenshot', async function () {
            const el = await p.findElement(next, driver, constants_1.IMAGE_STRATEGY, index_cjs_1.TEST_IMG_2_PART_B64);
            (0, chai_1.expect)(support_1.util.unwrapElement(el)).to.include('appium-image-element');
        });
        it('should find image elements inside a screenshot', async function () {
            const els = await p.findElements(next, driver, constants_1.IMAGE_STRATEGY, index_cjs_1.TEST_IMG_2_PART_B64);
            (0, chai_1.expect)(els).to.have.length(1);
            (0, chai_1.expect)(support_1.util.unwrapElement(els[0])).to.include('appium-image-element');
        });
    });
    describe('Element interactions', function () {
        let elId;
        before(async function () {
            driver.settings = { getSettings: () => ({}) };
            driver.isW3CProtocol = () => true;
            driver.getScreenshot = () => index_cjs_1.TEST_IMG_2_B64;
            driver.getWindowRect = () => ({ x: 0, y: 0, width: 64, height: 64 });
            const el = await p.findElement(next, driver, constants_1.IMAGE_STRATEGY, index_cjs_1.TEST_IMG_2_PART_B64);
            elId = support_1.util.unwrapElement(el);
        });
        it('should click on the screen coords of the middle of the element', async function () {
            let action = null;
            driver.performActions = async (a) => {
                action = a;
            };
            await p.handle(next, driver, 'click', elId);
            (0, chai_1.expect)(action).to.eql([
                {
                    type: 'pointer',
                    id: 'mouse',
                    parameters: { pointerType: 'touch' },
                    actions: [
                        { type: 'pointerMove', x: 24, y: 40, duration: 0 },
                        { type: 'pointerDown', button: 0 },
                        { type: 'pause', duration: 125 },
                        { type: 'pointerUp', button: 0 },
                    ],
                },
            ]);
        });
        it('should always say the element is displayed', async function () {
            await (0, chai_1.expect)(p.handle(next, driver, 'elementDisplayed', elId)).to.eventually.be.true;
        });
        it('should return the matched region size', async function () {
            await (0, chai_1.expect)(p.handle(next, driver, 'getSize', elId)).to.eventually.eql({
                width: 48,
                height: 48,
            });
        });
        it('should return the matched region location', async function () {
            await (0, chai_1.expect)(p.handle(next, driver, 'getLocation', elId)).to.eventually.eql({
                x: 0,
                y: 16,
            });
        });
        it('should return the region rect', async function () {
            await (0, chai_1.expect)(p.handle(next, driver, 'getElementRect', elId)).to.eventually.eql({
                x: 0,
                y: 16,
                height: 48,
                width: 48,
            });
        });
        it('should return the match score as the score attr', async function () {
            await (0, chai_1.expect)(p.handle(next, driver, 'getAttribute', 'score', elId)).to.eventually.be.above(0.7);
        });
        it('should return the match visualization as the visual attr', async function () {
            driver.settings = {
                getSettings: () => ({
                    getMatchedImageResult: true,
                }),
            };
            const el = await p.findElement(next, driver, constants_1.IMAGE_STRATEGY, index_cjs_1.TEST_IMG_2_PART_B64);
            elId = support_1.util.unwrapElement(el);
            await (0, chai_1.expect)(p.handle(next, driver, 'getAttribute', 'visual', elId)).to.eventually.include('iVBOR');
        });
        it('should not allow any other attrs', async function () {
            await (0, chai_1.expect)(p.handle(next, driver, 'getAttribute', 'rando', elId)).to.eventually.be.rejectedWith(/not yet/i);
        });
    });
    describe('performActions', function () {
        let imageEl;
        let nativeEl;
        before(async function () {
            imageEl = await p.findElement(next, driver, constants_1.IMAGE_STRATEGY, index_cjs_1.TEST_IMG_2_PART_B64);
            nativeEl = support_1.util.wrapElement('dummy-native-element-id');
        });
        it('should replace with coords of the image elements in pointerMove, scroll actions', async function () {
            const actionSequences = [
                {
                    type: 'pointer',
                    id: 'mouse',
                    parameters: { pointerType: 'touch' },
                    actions: [
                        { type: 'pointerMove', x: 0, y: 0, duration: 0, origin: imageEl },
                        { type: 'pointerMove', x: 15, y: 25, duration: 0, origin: imageEl },
                    ],
                },
                {
                    type: 'wheel',
                    id: 'wheel',
                    actions: [{ type: 'scroll', x: 1, y: 0, deltaX: 1, deltaY: 2, origin: imageEl }],
                },
            ];
            await p.performActions(next, driver, actionSequences);
            (0, chai_1.expect)(actionSequences).to.eql([
                {
                    type: 'pointer',
                    id: 'mouse',
                    parameters: { pointerType: 'touch' },
                    actions: [
                        { type: 'pointerMove', x: 24, y: 40, duration: 0 },
                        { type: 'pointerMove', x: 39, y: 65, duration: 0 },
                    ],
                },
                {
                    type: 'wheel',
                    id: 'wheel',
                    actions: [{ type: 'scroll', x: 25, y: 40, deltaX: 1, deltaY: 2 }],
                },
            ]);
        });
        it('should not be modified except pointerMove and scroll actions includes image element as origin', async function () {
            const actionSequences = [
                {
                    type: 'pointer',
                    id: 'mouse',
                    parameters: { pointerType: 'touch' },
                    actions: [
                        { type: 'pointerMove', x: 1, y: 1, duration: 0 },
                        { type: 'pointerMove', x: 2, y: 2, duration: 10, origin: nativeEl },
                        { type: 'pointerMove', x: 3, y: 3, duration: 20, origin: 'viewport' },
                        { type: 'pointerMove', x: 4, y: 4, duration: 30, origin: 'pointer' },
                        { type: 'pointerDown', button: 0 },
                        { type: 'pause', duration: 125 },
                        { type: 'pointerUp', button: 0 },
                    ],
                },
                {
                    type: 'wheel',
                    id: 'wheel',
                    actions: [
                        { type: 'scroll', x: 1, y: 1, deltaX: 1, deltaY: 2 },
                        { type: 'scroll', x: 2, y: 2, deltaX: 2, deltaY: 3, origin: nativeEl },
                        { type: 'scroll', x: 3, y: 3, deltaX: 3, deltaY: 4, origin: 'viewport' },
                        { type: 'scroll', x: 4, y: 4, deltaX: 4, deltaY: 5, origin: 'pointer' },
                    ],
                },
                {
                    type: 'key',
                    id: 'key',
                    actions: [
                        { type: 'keyDown', value: 'a' },
                        { type: 'keyUp', value: 'a' },
                    ],
                },
            ];
            const clone = structuredClone(actionSequences);
            await p.performActions(next, driver, actionSequences);
            (0, chai_1.expect)(actionSequences).to.eql(clone);
        });
    });
});
//# sourceMappingURL=plugin.spec.js.map