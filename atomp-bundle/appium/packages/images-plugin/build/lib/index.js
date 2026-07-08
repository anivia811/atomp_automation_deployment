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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareImages = exports.ImageElement = exports.ImageElementFinder = exports.IMAGE_STRATEGY = exports.getImgElFromArgs = exports.ImageElementPlugin = void 0;
var plugin_1 = require("./plugin");
Object.defineProperty(exports, "ImageElementPlugin", { enumerable: true, get: function () { return plugin_1.ImageElementPlugin; } });
Object.defineProperty(exports, "getImgElFromArgs", { enumerable: true, get: function () { return plugin_1.getImgElFromArgs; } });
var constants_1 = require("./constants");
Object.defineProperty(exports, "IMAGE_STRATEGY", { enumerable: true, get: function () { return constants_1.IMAGE_STRATEGY; } });
var finder_1 = require("./finder");
Object.defineProperty(exports, "ImageElementFinder", { enumerable: true, get: function () { return finder_1.ImageElementFinder; } });
var image_element_1 = require("./image-element");
Object.defineProperty(exports, "ImageElement", { enumerable: true, get: function () { return image_element_1.ImageElement; } });
__exportStar(require("./constants"), exports);
var compare_1 = require("./compare");
Object.defineProperty(exports, "compareImages", { enumerable: true, get: function () { return compare_1.compareImages; } });
//# sourceMappingURL=index.js.map