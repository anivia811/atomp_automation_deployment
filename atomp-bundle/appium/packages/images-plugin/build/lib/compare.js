"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareImages = compareImages;
const driver_1 = require("appium/driver");
const opencv_1 = require("@appium/opencv");
const constants_1 = require("./constants");
/**
 * Performs images comparison using OpenCV framework features.
 * It is expected that both OpenCV framework and opencv4nodejs
 * module are installed on the machine where Appium server is running.
 *
 * @param mode - One of possible comparison modes:
 * matchFeatures, getSimilarity, matchTemplate
 * @param firstImage - Base64-encoded image file.
 * All image formats, that OpenCV library itself accepts, are supported.
 * @param secondImage - Base64-encoded image file.
 * All image formats, that OpenCV library itself accepts, are supported.
 * @param options - The content of this dictionary depends
 * on the actual `mode` value. See the documentation on `@appium/support`
 * module for more details.
 * @returns The content of the resulting dictionary depends
 * on the actual `mode` and `options` values. See the documentation on
 * `@appium/support` module for more details.
 * @throws {Error} If required OpenCV modules are not installed or
 * if `mode` value is incorrect or if there was an unexpected issue while
 * matching the images.
 */
async function compareImages(mode, firstImage, secondImage, options = {}) {
    const img1 = Buffer.isBuffer(firstImage) ? firstImage : Buffer.from(firstImage, 'base64');
    const img2 = Buffer.isBuffer(secondImage) ? secondImage : Buffer.from(secondImage, 'base64');
    let result;
    switch (mode.toLowerCase()) {
        case constants_1.MATCH_FEATURES_MODE.toLowerCase():
            try {
                result = await (0, opencv_1.getImagesMatches)(img1, img2, options);
            }
            catch {
                // might throw if no matches
                result = { count: 0 };
            }
            break;
        case constants_1.GET_SIMILARITY_MODE.toLowerCase():
            result = await (0, opencv_1.getImagesSimilarity)(img1, img2, options);
            break;
        case constants_1.MATCH_TEMPLATE_MODE.toLowerCase(): {
            const opts = options;
            // firstImage/img1 is the full image and secondImage/img2 is the partial one
            result = await (0, opencv_1.getImageOccurrence)(img1, img2, opts);
            if (opts.multiple && result.multiple) {
                const multipleResults = result.multiple;
                if (multipleResults) {
                    return multipleResults.map(convertVisualizationToBase64);
                }
            }
            break;
        }
        default:
            throw new driver_1.errors.InvalidArgumentError(`'${mode}' images comparison mode is unknown. ` +
                `Only ${JSON.stringify([
                    constants_1.MATCH_FEATURES_MODE,
                    constants_1.GET_SIMILARITY_MODE,
                    constants_1.MATCH_TEMPLATE_MODE,
                ])} modes are supported.`);
    }
    return convertVisualizationToBase64(result);
}
/**
 * base64 encodes the visualization part of the result
 * (if necessary)
 *
 * @param element - occurrence result
 * @returns result with base64-encoded visualization
 **/
function convertVisualizationToBase64(element) {
    return Buffer.isBuffer(element.visualization)
        ? {
            ...element,
            visualization: element.visualization.toString('base64'),
        }
        : element;
}
//# sourceMappingURL=compare.js.map