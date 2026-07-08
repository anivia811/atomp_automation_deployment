"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const driver_1 = require("appium/driver");
const support_1 = require("appium/support");
const finder_1 = require("../../lib/finder");
const plugin_1 = require("../../lib/plugin");
const image_element_1 = require("../../lib/image-element");
const sinon_1 = require("sinon");
const constants_1 = require("../../lib/constants");
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
(0, chai_1.use)(chai_as_promised_1.default);
const defRect = { x: 100, y: 110, width: 50, height: 25 };
const defTemplate = Buffer.from('iVBORasdf', 'base64');
describe('ImageElement', function () {
    const driver = new driver_1.BaseDriver({});
    let sandbox;
    beforeEach(function () {
        sandbox = (0, sinon_1.createSandbox)();
    });
    afterEach(function () {
        sandbox.restore();
    });
    describe('.size', function () {
        it('should return the width and height of the image el', function () {
            const el = new image_element_1.ImageElement({
                template: defTemplate,
                rect: defRect,
                score: 1.0,
            });
            (0, chai_1.expect)(el.size).to.eql({ width: defRect.width, height: defRect.height });
        });
    });
    describe('.location', function () {
        it('should return the location of the image el', function () {
            const el = new image_element_1.ImageElement({
                template: defTemplate,
                rect: defRect,
                score: 1.0,
            });
            (0, chai_1.expect)(el.location).to.eql({ x: defRect.x, y: defRect.y });
        });
    });
    describe('.center', function () {
        it('should return the center location of the image el', function () {
            const el = new image_element_1.ImageElement({
                template: defTemplate,
                rect: defRect,
                score: 1.0,
            });
            (0, chai_1.expect)(el.center).to.eql({
                x: defRect.x + defRect.width / 2,
                y: defRect.y + defRect.height / 2,
            });
        });
    });
    describe('.asElement', function () {
        it('should get the webdriver object representation of the element', function () {
            const el = new image_element_1.ImageElement({
                template: defTemplate,
                rect: defRect,
                score: 1.0,
            });
            (0, chai_1.expect)(support_1.util.unwrapElement(el.asElement())).to.match(/^appium-image-el/);
        });
    });
    describe('.equals', function () {
        it('should say two image elements with same rect are equal', function () {
            const el1 = new image_element_1.ImageElement({
                template: Buffer.from('foo'),
                rect: defRect,
                score: 1.0,
            });
            const el2 = new image_element_1.ImageElement({
                template: Buffer.from('bar'),
                rect: defRect,
                score: 1.0,
            });
            (0, chai_1.expect)(el1.equals(el2)).to.be.true;
            (0, chai_1.expect)(el2.equals(el1)).to.be.true;
        });
        it('should say two image elements with different rect are not equal', function () {
            const el1 = new image_element_1.ImageElement({
                template: defTemplate,
                rect: { ...defRect, x: 0 },
                score: 1.0,
            });
            const el2 = new image_element_1.ImageElement({
                template: defTemplate,
                rect: defRect,
                score: 1.0,
            });
            (0, chai_1.expect)(el1.equals(el2)).to.be.false;
            (0, chai_1.expect)(el2.equals(el1)).to.be.false;
        });
    });
    describe('.click', function () {
        it('should reject an invalid tap strategy', async function () {
            const d = new driver_1.BaseDriver({});
            const el = new image_element_1.ImageElement({
                template: defTemplate,
                rect: defRect,
                score: 1.0,
            });
            await d.settings.update({ imageElementTapStrategy: 'bad' });
            await (0, chai_1.expect)(el.click(d)).to.be.rejectedWith(/Incorrect imageElementTapStrategy/);
        });
        it('should try to check for image element staleness, and throw if stale', async function () {
            const d = new driver_1.BaseDriver({});
            const f = new finder_1.ImageElementFinder();
            sandbox.stub(f, 'findByImage').throws();
            const el = new image_element_1.ImageElement({
                template: defTemplate,
                rect: defRect,
                score: 1.0,
                finder: f,
            });
            // we need to check for staleness if explicitly requested to do so
            await d.settings.update({
                checkForImageElementStaleness: true,
                autoUpdateImageElementPosition: false,
            });
            await (0, chai_1.expect)(el.click(d)).to.be.rejectedWith(/no longer attached/);
            // and also if we are updating the element position
            await d.settings.update({
                checkForImageElementStaleness: false,
                autoUpdateImageElementPosition: true,
            });
            await (0, chai_1.expect)(el.click(d)).to.be.rejectedWith(/no longer attached/);
        });
        it('should auto-update element position if requested', async function () {
            const d = new driver_1.BaseDriver({});
            d.performActions = () => { };
            sandbox.stub(d, 'performActions');
            const f = new finder_1.ImageElementFinder();
            const el = new image_element_1.ImageElement({
                template: defTemplate,
                rect: defRect,
                score: 1.0,
                finder: f,
            });
            const newRect = { ...defRect, x: defRect.x + 10, y: defRect.y + 5 };
            const elPos2 = new image_element_1.ImageElement({
                template: defTemplate,
                rect: newRect,
                score: 1.0,
                finder: f,
            });
            sandbox.stub(f, 'findByImage').returns(elPos2);
            await d.settings.update({
                autoUpdateImageElementPosition: true,
            });
            (0, chai_1.expect)(el.rect).to.not.eql(newRect);
            await el.click(d);
            (0, chai_1.expect)(el.rect).to.eql(newRect);
        });
        it('should tap the center of an element using w3c actions by default', async function () {
            const d = new driver_1.BaseDriver({});
            d.performActions = () => { };
            const actionStub = sandbox.stub(d, 'performActions');
            const el = new image_element_1.ImageElement({
                template: defTemplate,
                rect: defRect,
                score: 1.0,
            });
            // skip the staleness check for this test
            await d.settings.update({
                checkForImageElementStaleness: false,
            });
            await el.click(d);
            const pointerMoveAction = actionStub.args[0][0][0].actions[0];
            (0, chai_1.expect)(pointerMoveAction.x).to.equal(el.center.x);
            (0, chai_1.expect)(pointerMoveAction.y).to.equal(el.center.y);
        });
        it('should fall back to touchactions if w3c actions do not exist on driver', async function () {
            const d = new driver_1.BaseDriver({});
            d.performTouch = () => { };
            const actionStub = sandbox.stub(d, 'performTouch');
            const el = new image_element_1.ImageElement({
                template: defTemplate,
                rect: defRect,
                score: 1.0,
            });
            // skip the staleness check for this test
            await d.settings.update({
                checkForImageElementStaleness: false,
            });
            await el.click(d);
            const action = actionStub.args[0][0][0].options;
            (0, chai_1.expect)(action.x).to.equal(el.center.x);
            (0, chai_1.expect)(action.y).to.equal(el.center.y);
        });
        it('should use touchactions if requested', async function () {
            const d = new driver_1.BaseDriver({});
            d.performActions = () => { };
            const w3cStub = sandbox.stub(d, 'performActions');
            d.performTouch = () => { };
            const touchStub = sandbox.stub(d, 'performTouch');
            const el = new image_element_1.ImageElement({
                template: defTemplate,
                rect: defRect,
                score: 1.0,
            });
            // skip the staleness check for this test
            await d.settings.update({
                checkForImageElementStaleness: false,
                imageElementTapStrategy: 'touchActions',
            });
            await el.click(d);
            const action = touchStub.args[0][0][0].options;
            (0, chai_1.expect)(action.x).to.equal(el.center.x);
            (0, chai_1.expect)(action.y).to.equal(el.center.y);
            (0, chai_1.expect)(w3cStub.callCount).to.eql(0);
        });
        it('should throw if driver does not implement any type of action', async function () {
            const d = new driver_1.BaseDriver({});
            const el = new image_element_1.ImageElement({
                template: defTemplate,
                rect: defRect,
                score: 1.0,
            });
            // skip the staleness check for this test
            await d.settings.update({
                checkForImageElementStaleness: false,
            });
            await (0, chai_1.expect)(el.click(d)).to.be.rejectedWith(/did not implement/);
        });
    });
    describe('#execute', function () {
        // aGFwcHkgdGVzdGluZw== is 'happy testing'
        const f = new finder_1.ImageElementFinder();
        const imgEl = new image_element_1.ImageElement({
            template: defTemplate,
            rect: defRect,
            score: 0,
            match: Buffer.from('aGFwcHkgdGVzdGluZw==', 'base64'),
            finder: f,
        });
        let clickStub;
        before(function () {
            clickStub = sandbox.stub(imgEl, 'click');
            f.registerImageElement(imgEl);
            clickStub.returns(true);
        });
        it('should reject executions for unsupported commands', async function () {
            await (0, chai_1.expect)(image_element_1.ImageElement.execute(driver, imgEl, 'foobar')).to.be.rejectedWith(/not yet been implemented/);
        });
        it('should get displayed status of element', async function () {
            await (0, chai_1.expect)(image_element_1.ImageElement.execute(driver, imgEl, 'elementDisplayed')).to.eventually.be
                .true;
        });
        it('should get size of element', async function () {
            await (0, chai_1.expect)(image_element_1.ImageElement.execute(driver, imgEl, 'getSize')).to.eventually.eql({
                width: defRect.width,
                height: defRect.height,
            });
        });
        it('should get location of element', async function () {
            await (0, chai_1.expect)(image_element_1.ImageElement.execute(driver, imgEl, 'getLocation')).to.eventually.eql({
                x: defRect.x,
                y: defRect.y,
            });
        });
        it('should get location in view of element', async function () {
            await (0, chai_1.expect)(image_element_1.ImageElement.execute(driver, imgEl, 'getLocation')).to.eventually.eql({
                x: defRect.x,
                y: defRect.y,
            });
        });
        it('should get rect of element', async function () {
            await (0, chai_1.expect)(image_element_1.ImageElement.execute(driver, imgEl, 'getElementRect')).to.eventually.eql(defRect);
        });
        it('should get score of element', async function () {
            await (0, chai_1.expect)(image_element_1.ImageElement.execute(driver, imgEl, 'getAttribute', 'score')).to.eventually.eql(0);
        });
        it('should get visual of element', async function () {
            await (0, chai_1.expect)(image_element_1.ImageElement.execute(driver, imgEl, 'getAttribute', 'visual')).to.eventually.eql('aGFwcHkgdGVzdGluZw==');
        });
        it('should get null as visual of element by default', async function () {
            const imgElement = new image_element_1.ImageElement({
                template: defTemplate,
                rect: defRect,
                score: 1.0,
            });
            await (0, chai_1.expect)(image_element_1.ImageElement.execute(driver, imgElement, 'getAttribute', 'visual')).to.eventually.eql(null);
        });
        it('should not get other attribute', async function () {
            await (0, chai_1.expect)(image_element_1.ImageElement.execute(driver, imgEl, 'getAttribute', 'content-desc')).to.eventually.rejectedWith('Method has not yet been implemented');
        });
        it('should click element', async function () {
            await (0, chai_1.expect)(image_element_1.ImageElement.execute(driver, imgEl, 'click')).to.eventually.be.true;
        });
    });
});
describe('image element LRU cache', function () {
    it('should accept and cache image elements', function () {
        const el1 = new image_element_1.ImageElement({
            template: defTemplate,
            rect: defRect,
            score: 1.0,
        });
        const el2 = new image_element_1.ImageElement({
            template: defTemplate,
            rect: defRect,
            score: 1.0,
        });
        const finder = new finder_1.ImageElementFinder();
        finder.registerImageElement(el1);
        (0, chai_1.expect)(el1.equals(finder.getImageElement(el1.id))).to.be.true;
        (0, chai_1.expect)(finder.getImageElement(el2.id)).to.be.undefined;
    });
    it('once cache reaches max size, should eject image elements', function () {
        const el1 = new image_element_1.ImageElement({
            template: defTemplate,
            rect: defRect,
            score: 1.0,
        });
        const el2 = new image_element_1.ImageElement({
            template: defTemplate,
            rect: defRect,
            score: 1.0,
        });
        const finder = new finder_1.ImageElementFinder(1);
        finder.registerImageElement(el1);
        (0, chai_1.expect)(finder.getImageElement(el1.id)).to.not.be.undefined;
        finder.registerImageElement(el2);
        (0, chai_1.expect)(finder.getImageElement(el1.id)).to.be.undefined;
        (0, chai_1.expect)(finder.getImageElement(el2.id)).to.not.be.undefined;
    });
});
describe('getImgElFromArgs', function () {
    it('should return the image element id from json obj in args', function () {
        const imgEl = `${constants_1.IMAGE_ELEMENT_PREFIX}foo`;
        const args = [1, 'foo', imgEl];
        (0, chai_1.expect)((0, plugin_1.getImgElFromArgs)(args)).to.eql(imgEl);
    });
    it('should not return anything if image element id not in args', function () {
        const args = [1, 'foo'];
        (0, chai_1.expect)((0, plugin_1.getImgElFromArgs)(args)).to.be.undefined;
    });
    it('should not find image element id in anything but prefix', function () {
        const notImgEl = `foo${constants_1.IMAGE_ELEMENT_PREFIX}`;
        const args = [1, 'foo', notImgEl];
        (0, chai_1.expect)((0, plugin_1.getImgElFromArgs)(args)).to.be.undefined;
    });
});
//# sourceMappingURL=image-element.spec.js.map