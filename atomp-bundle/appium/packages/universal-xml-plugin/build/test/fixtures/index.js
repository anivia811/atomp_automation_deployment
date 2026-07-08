"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XML_WEBVIEW = exports.XML_IOS_EDGE_TRANSFORMED = exports.XML_IOS_EDGE = exports.XML_ANDROID_TRANSFORMED_INDEX_PATH = exports.XML_IOS_TRANSFORMED_INDEX_PATH = exports.XML_ANDROID_TRANSFORMED = exports.XML_IOS_TRANSFORMED = exports.XML_ANDROID = exports.XML_IOS = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const XML_IOS = node_fs_1.default.readFileSync(node_path_1.default.resolve(__dirname, 'ios.xml'), 'utf8').trim();
exports.XML_IOS = XML_IOS;
const XML_IOS_TRANSFORMED = node_fs_1.default.readFileSync(node_path_1.default.resolve(__dirname, 'ios-transformed.xml'), 'utf8').trim();
exports.XML_IOS_TRANSFORMED = XML_IOS_TRANSFORMED;
const XML_IOS_TRANSFORMED_INDEX_PATH = node_fs_1.default.readFileSync(node_path_1.default.resolve(__dirname, 'ios-transformed-path.xml'), 'utf8').trim();
exports.XML_IOS_TRANSFORMED_INDEX_PATH = XML_IOS_TRANSFORMED_INDEX_PATH;
const XML_IOS_EDGE = node_fs_1.default.readFileSync(node_path_1.default.resolve(__dirname, 'ios-edge.xml'), 'utf8').trim();
exports.XML_IOS_EDGE = XML_IOS_EDGE;
const XML_IOS_EDGE_TRANSFORMED = node_fs_1.default.readFileSync(node_path_1.default.resolve(__dirname, 'ios-transformed-edge.xml'), 'utf8').trim();
exports.XML_IOS_EDGE_TRANSFORMED = XML_IOS_EDGE_TRANSFORMED;
const XML_ANDROID = node_fs_1.default.readFileSync(node_path_1.default.resolve(__dirname, 'android.xml'), 'utf8').trim();
exports.XML_ANDROID = XML_ANDROID;
const XML_ANDROID_TRANSFORMED = node_fs_1.default.readFileSync(node_path_1.default.resolve(__dirname, 'android-transformed.xml'), 'utf8').trim();
exports.XML_ANDROID_TRANSFORMED = XML_ANDROID_TRANSFORMED;
const XML_ANDROID_TRANSFORMED_INDEX_PATH = node_fs_1.default.readFileSync(node_path_1.default.resolve(__dirname, 'android-transformed-path.xml'), 'utf8').trim();
exports.XML_ANDROID_TRANSFORMED_INDEX_PATH = XML_ANDROID_TRANSFORMED_INDEX_PATH;
const XML_WEBVIEW = node_fs_1.default.readFileSync(node_path_1.default.resolve(__dirname, 'web-view.xml'), 'utf8').trim();
exports.XML_WEBVIEW = XML_WEBVIEW;
//# sourceMappingURL=index.js.map