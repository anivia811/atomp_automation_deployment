"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SETTINGS = exports.DEFAULT_FIX_IMAGE_TEMPLATE_SCALE = exports.DEFAULT_MATCH_THRESHOLD = exports.MATCH_TEMPLATE_MODE = exports.GET_SIMILARITY_MODE = exports.MATCH_FEATURES_MODE = exports.DEFAULT_TEMPLATE_IMAGE_SCALE = exports.IMAGE_TAP_STRATEGIES = exports.IMAGE_EL_TAP_STRATEGY_MJSONWP = exports.IMAGE_EL_TAP_STRATEGY_W3C = exports.IMAGE_ELEMENT_PREFIX = exports.IMAGE_STRATEGY = void 0;
const support_1 = require("appium/support");
exports.IMAGE_STRATEGY = '-image';
exports.IMAGE_ELEMENT_PREFIX = 'appium-image-element-';
exports.IMAGE_EL_TAP_STRATEGY_W3C = 'w3cActions';
exports.IMAGE_EL_TAP_STRATEGY_MJSONWP = 'touchActions';
exports.IMAGE_TAP_STRATEGIES = [
    exports.IMAGE_EL_TAP_STRATEGY_MJSONWP,
    exports.IMAGE_EL_TAP_STRATEGY_W3C,
];
exports.DEFAULT_TEMPLATE_IMAGE_SCALE = 1.0;
exports.MATCH_FEATURES_MODE = 'matchFeatures';
exports.GET_SIMILARITY_MODE = 'getSimilarity';
exports.MATCH_TEMPLATE_MODE = 'matchTemplate';
exports.DEFAULT_MATCH_THRESHOLD = 0.4;
exports.DEFAULT_FIX_IMAGE_TEMPLATE_SCALE = 1;
exports.DEFAULT_SETTINGS = support_1.node.deepFreeze({
    imageMatchThreshold: exports.DEFAULT_MATCH_THRESHOLD,
    imageMatchMethod: '',
    fixImageFindScreenshotDims: true,
    fixImageTemplateSize: false,
    fixImageTemplateScale: false,
    defaultImageTemplateScale: exports.DEFAULT_TEMPLATE_IMAGE_SCALE,
    checkForImageElementStaleness: true,
    autoUpdateImageElementPosition: false,
    imageElementTapStrategy: exports.IMAGE_EL_TAP_STRATEGY_W3C,
    getMatchedImageResult: false,
});
//# sourceMappingURL=constants.js.map