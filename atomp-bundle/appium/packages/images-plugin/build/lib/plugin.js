"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageElementPlugin = void 0;
exports.getImgElFromArgs = getImgElFromArgs;
const driver_1 = require("appium/driver");
const support_1 = require("@appium/support");
const plugin_1 = require("appium/plugin");
const compare_1 = require("./compare");
const finder_1 = require("./finder");
const image_element_1 = require("./image-element");
const constants_1 = require("./constants");
class ImageElementPlugin extends plugin_1.BasePlugin {
    // this plugin supports a non-standard 'compare images' command
    static newMethodMap = {
        '/session/:sessionId/appium/compare_images': {
            POST: {
                command: 'compareImages',
                payloadParams: {
                    required: ['mode', 'firstImage', 'secondImage'],
                    optional: ['options'],
                },
                neverProxy: true,
            },
        },
    };
    finder;
    constructor(pluginName) {
        super(pluginName);
        this.finder = new finder_1.ImageElementFinder();
    }
    async compareImages(next, driver, mode, firstImage, secondImage, options) {
        return await (0, compare_1.compareImages)(mode, firstImage, secondImage, options);
    }
    async findElement(next, driver, ...args) {
        return await this._find(false, next, driver, ...args);
    }
    async findElements(next, driver, ...args) {
        return await this._find(true, next, driver, ...args);
    }
    async handle(next, driver, cmdName, ...args) {
        // if we have a command that involves an image element id, attempt to find the image element
        // and execute the command on it
        const imgElId = getImgElFromArgs(args);
        if (imgElId) {
            const imgEl = this.finder.getImageElement(imgElId);
            if (!imgEl) {
                throw new driver_1.errors.NoSuchElementError();
            }
            return await image_element_1.ImageElement.execute(driver, imgEl, cmdName, ...args);
        }
        if (cmdName === 'deleteSession') {
            this.finder.clearImageElements();
        }
        // otherwise just do the normal thing
        return await next();
    }
    async performActions(next, driver, actionSequences) {
        // Replace with coordinates when ActionSequence includes image elements.
        for (const actionSequence of actionSequences) {
            for (const action of actionSequence.actions) {
                // The actions that can have an Element as the origin are "pointerMove" and "scroll".
                if (!support_1.util.isPlainObject(action.origin)) {
                    continue;
                }
                const actionWithEl = action;
                const elId = support_1.util.unwrapElement(actionWithEl.origin);
                if (!elId?.startsWith(constants_1.IMAGE_ELEMENT_PREFIX)) {
                    continue;
                }
                const imgEl = this.finder.getImageElement(elId);
                if (!imgEl) {
                    throw new driver_1.errors.NoSuchElementError();
                }
                // Add the element's center coordinates to the offset value.
                actionWithEl.x += imgEl.center.x;
                actionWithEl.y += imgEl.center.y;
                // Set the origin to the viewport so that the external driver can process it using coordinates.
                delete actionWithEl.origin;
            }
        }
        return await next();
    }
    async _find(multiple, next, driver, ...args) {
        const [strategy, selector] = args;
        // if we're not actually finding by image, just do the normal thing
        if (strategy !== constants_1.IMAGE_STRATEGY) {
            return await next();
        }
        return await this.finder.findByImage(Buffer.from(selector, 'base64'), driver, { multiple });
    }
}
exports.ImageElementPlugin = ImageElementPlugin;
/**
 * Returns the first image-element id found in command args.
 * @param args Command arguments.
 */
function getImgElFromArgs(args) {
    return args.find((arg) => typeof arg === 'string' && arg.startsWith(constants_1.IMAGE_ELEMENT_PREFIX));
}
//# sourceMappingURL=plugin.js.map