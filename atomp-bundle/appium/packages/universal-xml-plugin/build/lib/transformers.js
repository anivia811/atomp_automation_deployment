"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ios = ios;
exports.android = android;
const source_1 = require("./source");
/**
 * No-op transformer for iOS source XML.
 * @param nodeObj Node object to transform.
 */
function ios(nodeObj) {
    void nodeObj;
    // iOS transformer does nothing
}
/**
 * Normalizes Android-specific attributes in source XML.
 * @param nodeObj Node object to transform.
 * @param metadata Transformation metadata.
 */
function android(nodeObj, metadata) {
    // strip android:id from front of id
    const resId = nodeObj[`${source_1.ATTR_PREFIX}resource-id`];
    if (resId && metadata.appPackage) {
        nodeObj[`${source_1.ATTR_PREFIX}resource-id`] = resId.replace(`${metadata.appPackage}:id/`, '');
    }
    // turn bounds attr into rect-based attrs
    if (nodeObj[`${source_1.ATTR_PREFIX}bounds`]) {
        const boundsArray = nodeObj[`${source_1.ATTR_PREFIX}bounds`]
            .split(/\[|\]|,/)
            .filter((str) => str !== '');
        const [x, y, x2, y2] = boundsArray;
        const width = parseInt(x2, 10) - parseInt(x, 10);
        const height = parseInt(y2, 10) - parseInt(y, 10);
        nodeObj[`${source_1.ATTR_PREFIX}x`] = x;
        nodeObj[`${source_1.ATTR_PREFIX}y`] = y;
        nodeObj[`${source_1.ATTR_PREFIX}width`] = width.toString();
        nodeObj[`${source_1.ATTR_PREFIX}height`] = height.toString();
    }
}
//# sourceMappingURL=transformers.js.map