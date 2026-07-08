"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversalXMLPlugin = void 0;
const plugin_1 = require("appium/plugin");
const driver_1 = require("appium/driver");
const source_1 = require("./source");
const xpath_1 = require("./xpath");
class UniversalXMLPlugin extends plugin_1.BasePlugin {
    async getPageSource(next, driver, sessId, addIndexPath = false) {
        void sessId;
        const source = (next ? await next() : await driver.getPageSource());
        const metadata = {};
        const platformName = getPlatformName(driver);
        if (platformName.toLowerCase() === 'android') {
            metadata.appPackage = driver.opts?.appPackage;
        }
        const { xml, unknowns } = await (0, source_1.transformSourceXml)(source, platformName.toLowerCase(), {
            metadata,
            addIndexPath,
        });
        if (unknowns.nodes.length) {
            this.log.warn(`The XML mapper found ${unknowns.nodes.length} node(s) / ` +
                `tag name(s) that it didn't know about. These should be ` +
                `reported to improve the quality of the plugin: ` +
                unknowns.nodes.join(', '));
        }
        if (unknowns.attrs.length) {
            this.log.warn(`The XML mapper found ${unknowns.attrs.length} attributes ` +
                `that it didn't know about. These should be reported to ` +
                `improve the quality of the plugin: ` +
                unknowns.attrs.join(', '));
        }
        return xml;
    }
    async findElement(next, driver, strategy, selector) {
        return (await this._find(false, next, driver, strategy, selector));
    }
    async findElements(next, driver, strategy, selector) {
        return (await this._find(true, next, driver, strategy, selector));
    }
    async _find(multiple, next, driver, strategy, selector) {
        const platformName = getPlatformName(driver);
        if (strategy.toLowerCase() !== 'xpath' ||
            !driver.getCurrentContext ||
            (await driver.getCurrentContext()) !== 'NATIVE_APP') {
            return (await next());
        }
        const xml = await this.getPageSource(null, driver, null, true);
        let newSelector = (0, xpath_1.transformQuery)(selector, xml, multiple);
        // if the selector was not able to be transformed, that means no elements were found that
        // matched, so do the appropriate thing based on element vs elements
        if (newSelector === null) {
            this.log.warn(`Selector was not able to be translated to underlying XML. Either the requested ` +
                `element does not exist or there was an error in translation`);
            if (multiple) {
                return [];
            }
            throw new driver_1.errors.NoSuchElementError();
        }
        if (platformName.toLowerCase() === 'ios') {
            // with the XCUITest driver, the <AppiumAUT> wrapper element is present in the source but is
            // not present in the source considered by WDA, so our index path based xpath queries will
            // not work with WDA as-is. We need to remove the first path segment.
            newSelector = newSelector.replace(/^\/\*\[1\]/, '');
        }
        this.log.info(`Selector was translated to: ${newSelector}`);
        // otherwise just run the transformed query!
        const finder = multiple ? 'findElements' : 'findElement';
        return (await driver[finder](strategy, newSelector));
    }
}
exports.UniversalXMLPlugin = UniversalXMLPlugin;
function getPlatformName(driver) {
    return driver.caps?.platformName || '';
}
//# sourceMappingURL=plugin.js.map