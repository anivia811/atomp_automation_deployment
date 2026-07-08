"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_1 = require("../../lib/plugin");
const driver_1 = require("appium/driver");
const fixtures_1 = require("../fixtures");
const xpath_1 = require("../../lib/xpath");
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
(0, chai_1.use)(chai_as_promised_1.default);
describe('UniversalXMLPlugin', function () {
    let next;
    const p = new plugin_1.UniversalXMLPlugin('test');
    describe('getPageSource', function () {
        const driver = new driver_1.BaseDriver({});
        it('should transform page source for ios', async function () {
            driver.getCurrentContext = () => 'NATIVE_APP';
            next = driver.getPageSource = () => Promise.resolve(fixtures_1.XML_IOS);
            driver.caps = { platformName: 'iOS' };
            await (0, chai_1.expect)(p.getPageSource(next, driver)).to.eventually.eql(fixtures_1.XML_IOS_TRANSFORMED);
        });
        it('should transform page source for android', async function () {
            driver.getCurrentContext = () => 'NATIVE_APP';
            next = driver.getPageSource = () => Promise.resolve(fixtures_1.XML_ANDROID);
            driver.caps = { platformName: 'Android' };
            driver.opts = { appPackage: 'io.cloudgrey.the_app' };
            await (0, chai_1.expect)(p.getPageSource(next, driver)).to.eventually.eql(fixtures_1.XML_ANDROID_TRANSFORMED);
        });
    });
    describe('findElement(s)', function () {
        const driver = new driver_1.BaseDriver({});
        it('should turn an xpath query into another query run on the original ios source', async function () {
            driver.getCurrentContext = () => 'NATIVE_APP';
            next = driver.getPageSource = () => Promise.resolve(fixtures_1.XML_IOS);
            driver.caps = { platformName: 'iOS' };
            // mock out the findElement function to just return an xml node from the fixture
            driver.findElement = (strategy, selector) => {
                const nodes = (0, xpath_1.runQuery)(selector, fixtures_1.XML_IOS.replace(/<\/?AppiumAUT>/g, ''));
                return nodes[0];
            };
            const node = await p.findElement(next, driver, 'xpath', '//TextInput[@axId="username"]');
            (0, chai_1.expect)((0, xpath_1.getNodeAttrVal)(node, 'value')).to.eql('alice');
            (0, chai_1.expect)(node.nodeName).to.eql('XCUIElementTypeTextField');
        });
        it('should turn an xpath query into another query run on the original android source', async function () {
            driver.getCurrentContext = () => 'NATIVE_APP';
            next = driver.getPageSource = () => Promise.resolve(fixtures_1.XML_ANDROID);
            driver.caps = { platformName: 'Android' };
            driver.opts = { appPackage: 'io.cloudgrey.the_app' };
            driver.findElement = (strategy, selector) => {
                const nodes = (0, xpath_1.runQuery)(selector, fixtures_1.XML_ANDROID);
                return nodes[0];
            };
            const node = await p.findElement(next, driver, 'xpath', '//TextInput[@axId="username"]');
            (0, chai_1.expect)((0, xpath_1.getNodeAttrVal)(node, 'content-desc')).to.eql('username');
            (0, chai_1.expect)(node.nodeName).to.eql('android.widget.EditText');
        });
        it('should not modify the xpath query and proxy the call to underlying driver', async function () {
            driver.getCurrentContext = () => 'WEB_VIEW';
            driver.findElement = () => ({});
            driver.caps = { platformName: 'Android' };
            driver.opts = { appPackage: 'io.cloudgrey.the_app' };
            const selector = '//div[@id="section-1"]';
            next = () => {
                const nodes = (0, xpath_1.runQuery)(selector, fixtures_1.XML_WEBVIEW);
                return Promise.resolve(nodes[0]);
            };
            const node = await p.findElement(next, driver, 'xpath', selector);
            (0, chai_1.expect)((0, xpath_1.getNodeAttrVal)(node, 'id')).to.eql('section-1');
            (0, chai_1.expect)(node.nodeName).to.eql('div');
        });
    });
});
//# sourceMappingURL=plugin.spec.js.map