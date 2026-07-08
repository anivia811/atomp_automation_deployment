"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageElement = void 0;
const driver_1 = require("appium/driver");
const support_1 = require("@appium/support");
const logger_1 = require("./logger");
const constants_1 = require("./constants");
const TAP_DURATION_MS = 125;
/**
 * Representation of an "image element", which is simply a set of coordinates
 * and methods that can be used on that set of coordinates via the driver
 */
class ImageElement {
    template;
    rect;
    id;
    match;
    score;
    finder;
    containerRect;
    constructor({ template, rect, score, match = null, finder = null, containerRect = null, }) {
        this.template = template;
        this.rect = rect;
        this.id = `${constants_1.IMAGE_ELEMENT_PREFIX}${support_1.util.uuidV4()}`;
        this.match = match;
        this.score = score;
        this.finder = finder;
        this.containerRect = containerRect;
    }
    /**
     * @returns dimension of element
     */
    get size() {
        return { width: this.rect.width, height: this.rect.height };
    }
    /**
     * @returns coordinates of top-left corner of element
     */
    get location() {
        return { x: this.rect.x, y: this.rect.y };
    }
    /**
     * @returns coordinates of center of element
     */
    get center() {
        return {
            x: this.rect.x + this.rect.width / 2,
            y: this.rect.y + this.rect.height / 2,
        };
    }
    /**
     * @returns the base64-encoded original image used for matching
     */
    get originalImage() {
        return this.template.toString('base64');
    }
    /**
     * @returns the base64-encoded image which has matched marks
     */
    get matchedImage() {
        return this.match?.toString('base64') ?? null;
    }
    /**
     * Handle various Appium commands that involve an image element
     *
     * @param driver - the driver to use for commands
     * @param cmd - the name of the driver command
     * @param imgEl - image element object
     * @param args - Rest of arguments for executeScripts
     *
     * @returns the result of running a command
     */
    static async execute(driver, imgEl, cmd, ...args) {
        switch (cmd) {
            case 'click':
                return await imgEl.click(driver);
            case 'findElementFromElement':
                return await imgEl.find(false, driver, ...args);
            case 'findElementsFromElement':
                return await imgEl.find(true, driver, ...args);
            case 'elementDisplayed':
                return true;
            case 'getSize':
                return imgEl.size;
            case 'getLocation':
            case 'getLocationInView':
                return imgEl.location;
            case 'getElementRect':
                return imgEl.rect;
            case 'getElementScreenshot':
                return imgEl.originalImage;
            case 'getAttribute':
                // /session/:sessionId/element/:elementId/attribute/:name
                // /session/:sessionId/element/:elementId/attribute/visual should return the visual data
                // e.g. ["content-desc","appium-image-element-xxxxx","xxxxx"], ["visual","appium-image-element-xxxxx","xxxxx"]
                switch (args[0]) {
                    case 'visual':
                        return imgEl.matchedImage;
                    case 'score':
                        return imgEl.score;
                    default:
                        throw new driver_1.errors.NotYetImplementedError();
                }
            default:
                throw new driver_1.errors.NotYetImplementedError();
        }
    }
    /**
     *
     * @returns this image element as a WebElement
     */
    asElement() {
        return support_1.util.wrapElement(this.id);
    }
    /**
     * @param other - an ImageElement to compare with this one
     *
     * @returns whether the other element and this one have the same properties
     */
    equals(other) {
        return (this.rect.x === other.rect.x &&
            this.rect.y === other.rect.y &&
            this.rect.width === other.rect.width &&
            this.rect.height === other.rect.height);
    }
    /**
     * Use a driver to tap the screen at the center of this ImageElement's
     * position
     *
     * @param driver - driver for calling actions with
     */
    async click(driver) {
        // before we click we need to make sure the element is actually still there
        // where we expect it to be
        const settings = { ...constants_1.DEFAULT_SETTINGS, ...driver.settings.getSettings() };
        const { autoUpdateImageElementPosition: updatePos, checkForImageElementStaleness, imageElementTapStrategy, } = settings;
        // validate tap strategy
        if (!constants_1.IMAGE_TAP_STRATEGIES.includes(imageElementTapStrategy)) {
            throw new Error(`Incorrect imageElementTapStrategy setting ` +
                `'${imageElementTapStrategy}'. Must be one of ` +
                JSON.stringify(constants_1.IMAGE_TAP_STRATEGIES));
        }
        let newImgEl;
        if (checkForImageElementStaleness || updatePos) {
            logger_1.log.info('Checking image element for staleness before clicking');
            try {
                if (!this.finder) {
                    throw new driver_1.errors.StaleElementReferenceError();
                }
                newImgEl = (await this.finder.findByImage(this.template, driver, {
                    shouldCheckStaleness: true,
                    // Set ignoreDefaultImageTemplateScale because this.template is device screenshot based image
                    // managed inside Appium after finidng image by template which managed by a user
                    ignoreDefaultImageTemplateScale: true,
                    containerRect: this.containerRect,
                }));
            }
            catch {
                throw new driver_1.errors.StaleElementReferenceError();
            }
            if (!this.equals(newImgEl)) {
                logger_1.log.warn(`When trying to click on an image element, the image changed ` +
                    `position from where it was originally found. It is now at ` +
                    `${JSON.stringify(newImgEl.rect)} and was originally at ` +
                    `${JSON.stringify(this.rect)}.`);
                if (updatePos) {
                    logger_1.log.warn('Click will proceed at new coordinates');
                    this.rect = { ...newImgEl.rect };
                }
                else {
                    logger_1.log.warn('Click will take place at original coordinates. If you ' +
                        'would like Appium to automatically click the new ' +
                        "coordinates, set the 'autoUpdateImageElementPosition' " +
                        'setting to true');
                }
            }
        }
        const { x, y } = this.center;
        logger_1.log.info(`Will tap on image element at coordinate [${x}, ${y}]`);
        if (imageElementTapStrategy === constants_1.IMAGE_EL_TAP_STRATEGY_W3C) {
            // set up a W3C action to click on the image by position
            logger_1.log.info('Will tap using W3C actions');
            const action = {
                type: 'pointer',
                id: 'mouse',
                parameters: { pointerType: 'touch' },
                actions: [
                    { type: 'pointerMove', x, y, duration: 0 },
                    { type: 'pointerDown', button: 0 },
                    { type: 'pause', duration: TAP_DURATION_MS },
                    { type: 'pointerUp', button: 0 },
                ],
            };
            // check if the driver has the appropriate performActions method
            if ('performActions' in driver && typeof driver.performActions === 'function') {
                return await driver.performActions([action]);
            }
            // if not, warn and fall back to the other method
            logger_1.log.warn('Driver does not seem to implement W3C actions, falling back ' + 'to TouchActions');
        }
        // if the w3c strategy was not requested, do the only other option (mjsonwp
        // touch actions)
        logger_1.log.info('Will tap using MJSONWP TouchActions');
        const action = {
            action: 'tap',
            options: { x, y },
        };
        if ('performTouch' in driver && typeof driver.performTouch === 'function') {
            return await driver.performTouch([action]);
        }
        throw new Error("Driver did not implement the 'performTouch' command. " +
            'For drivers to support finding image elements, they ' +
            "should support 'performTouch' and 'performActions'");
    }
    /**
     * Perform lookup of image element(s) inside of the current element
     *
     * @param multiple - Whether to lookup multiple elements
     * @param driver - The driver to use for commands
     * @param args - Rest of arguments for executeScripts
     * @returns WebDriver element with a special id prefix
     */
    async find(multiple, driver, ...args) {
        const [strategy, selector] = args;
        if (strategy !== constants_1.IMAGE_STRATEGY) {
            throw new driver_1.errors.InvalidSelectorError(`Lookup strategies other than '${constants_1.IMAGE_STRATEGY}' are not supported`);
        }
        if (!this.finder) {
            throw new Error('Finder is not available');
        }
        return await this.finder.findByImage(Buffer.from(selector, 'base64'), driver, {
            multiple,
            containerRect: this.rect,
        });
    }
}
exports.ImageElement = ImageElement;
//# sourceMappingURL=image-element.js.map