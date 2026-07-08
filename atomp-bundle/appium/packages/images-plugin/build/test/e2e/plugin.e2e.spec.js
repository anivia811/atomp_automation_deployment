"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const webdriverio_1 = require("webdriverio");
const constants_1 = require("../../lib/constants");
const index_cjs_1 = require("../fixtures/index.cjs");
const plugin_test_support_1 = require("@appium/plugin-test-support");
const support_1 = require("@appium/support");
const sharp_1 = __importDefault(require("sharp"));
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
(0, chai_1.use)(chai_as_promised_1.default);
const THIS_PLUGIN_DIR = support_1.node.getModuleRootSync('@appium/images-plugin', __filename);
const APPIUM_HOME = node_path_1.default.join(THIS_PLUGIN_DIR, 'local_appium_home');
const FAKE_DRIVER_DIR = node_path_1.default.join(THIS_PLUGIN_DIR, '..', 'fake-driver');
const TEST_HOST = '127.0.0.1';
const TEST_FAKE_APP = node_path_1.default.join(APPIUM_HOME, 'node_modules', '@appium', 'fake-driver', 'test', 'fixtures', 'app.xml');
const TEST_CAPS = {
    platformName: 'Fake',
    'appium:automationName': 'Fake',
    'appium:deviceName': 'Fake',
    'appium:app': TEST_FAKE_APP,
};
const WDIO_OPTS = {
    hostname: TEST_HOST,
    connectionRetryCount: 0,
    capabilities: TEST_CAPS,
};
describe('ImageElementPlugin', function () {
    const { setup, teardown } = (0, plugin_test_support_1.pluginE2EHarness)({
        host: TEST_HOST,
        appiumHome: APPIUM_HOME,
        driverName: 'fake',
        driverSource: 'local',
        driverSpec: FAKE_DRIVER_DIR,
        pluginName: 'images',
        pluginSource: 'local',
        pluginSpec: THIS_PLUGIN_DIR,
    });
    let driver;
    before(async function () {
        const { server } = await setup();
        const address = server.address();
        WDIO_OPTS.port = address.port;
    });
    after(async function () {
        await teardown();
    });
    beforeEach(async function () {
        driver = await (0, webdriverio_1.remote)(WDIO_OPTS);
    });
    afterEach(async function () {
        if (driver) {
            await driver.deleteSession();
        }
    });
    it('should add the compareImages route', async function () {
        let comparison = await driver.compareImages(constants_1.MATCH_FEATURES_MODE, index_cjs_1.TEST_IMG_1_B64, index_cjs_1.TEST_IMG_2_B64, {});
        (0, chai_1.expect)(comparison.count).to.eql(0);
        comparison = await driver.compareImages(constants_1.GET_SIMILARITY_MODE, index_cjs_1.TEST_IMG_1_B64, index_cjs_1.TEST_IMG_2_B64, {});
        (0, chai_1.expect)(comparison.score).to.be.above(0.2);
    });
    it('should find and interact with image elements', async function () {
        const imageEl = await driver.$(index_cjs_1.APPSTORE_IMG_PATH);
        const { x, y } = await imageEl.getLocation();
        const { width, height } = await imageEl.getSize();
        (0, chai_1.expect)(x).to.eql(28);
        (0, chai_1.expect)(y).to.eql(72);
        (0, chai_1.expect)(width).to.eql(80);
        (0, chai_1.expect)(height).to.eql(91);
        await imageEl.click();
        const actionSequence = {
            type: 'pointer',
            id: 'mouse',
            parameters: { pointerType: 'touch' },
            actions: [
                { type: 'pointerMove', x: 0, y: 0, duration: 0, origin: imageEl },
                { type: 'pointerDown', button: 0 },
                { type: 'pause', duration: 125 },
                { type: 'pointerUp', button: 0 },
            ],
        };
        await driver.performActions([actionSequence]);
    });
    it('should find subelements', async function () {
        const imageEl = await driver.$(index_cjs_1.APPSTORE_IMG_PATH);
        const { width, height } = await imageEl.getSize();
        const tmpRoot = await support_1.tempDir.openDir();
        try {
            const screenshotPath = node_path_1.default.join(tmpRoot, 'element.png');
            await imageEl.saveScreenshot(screenshotPath);
            const tmpImgPath = node_path_1.default.join(tmpRoot, 'region.png');
            await (0, sharp_1.default)(screenshotPath)
                .extract({
                left: parseInt((width / 4).toString(), 10),
                top: parseInt((height / 4).toString(), 10),
                width: parseInt((width / 2).toString(), 10),
                height: parseInt((height / 2).toString(), 10),
            })
                .toFile(tmpImgPath);
            const subEl = await imageEl.$(tmpImgPath);
            (0, chai_1.expect)(subEl).to.not.be.null;
        }
        finally {
            await support_1.fs.rimraf(tmpRoot);
        }
    });
});
//# sourceMappingURL=plugin.e2e.spec.js.map