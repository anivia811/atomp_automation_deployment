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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeWebViewImpl = exports.FakeApp = void 0;
const support_1 = require("appium/support");
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const xmldom_1 = __importDefault(require("@xmldom/xmldom"));
const xpath = __importStar(require("xpath"));
const logger_1 = require("./logger");
const fake_element_1 = require("./fake-element");
const SCREENSHOT = node_path_1.default.join(__dirname, 'screen.png');
/** In-memory app model: XML DOM, webviews, alerts, geo, orientation, actions log. */
class FakeApp {
    dom;
    activeDom;
    activeWebview;
    activeFrame;
    activeAlert;
    lat;
    long;
    rawXml;
    currentOrientation;
    actionLog;
    _width;
    _height;
    constructor() {
        this.dom = null;
        this.activeDom = null;
        this.activeWebview = null;
        this.activeFrame = null;
        this.activeAlert = null;
        this.lat = 0;
        this.long = 0;
        this._width = null;
        this._height = null;
        this.rawXml = '';
        this.currentOrientation = 'PORTRAIT';
        this.actionLog = [];
    }
    get title() {
        const nodes = this.xpathQuery('//title');
        if (!Array.isArray(nodes) || nodes.length < 1) {
            throw new Error('No title!');
        }
        const node = nodes[0];
        const firstChild = node.firstChild;
        return firstChild?.data ?? '';
    }
    get currentGeoLocation() {
        return {
            latitude: this.lat,
            longitude: this.long,
        };
    }
    get orientation() {
        return this.currentOrientation;
    }
    get width() {
        if (this._width === null) {
            this.setDims();
        }
        const w = this._width;
        if (w === null) {
            throw new Error('Cannot fetch app dimensions');
        }
        return w;
    }
    get height() {
        if (this._height === null) {
            this.setDims();
        }
        const h = this._height;
        if (h === null) {
            throw new Error('Cannot fetch app dimensions');
        }
        return h;
    }
    set orientation(o) {
        this.currentOrientation = o;
    }
    async loadApp(appPath) {
        logger_1.log.info(`Loading Mock app model at ${appPath}`);
        const data = await support_1.fs.readFile(appPath);
        logger_1.log.info('Parsing Mock app XML');
        this.rawXml = data.toString();
        this.rawXml = this.rawXml.replace('<app ', '<AppiumAUT><app ');
        this.rawXml = this.rawXml.replace('<app>', '<AppiumAUT><app>');
        this.rawXml = this.rawXml.replace('</app>', '</app></AppiumAUT>');
        this.dom = new xmldom_1.default.DOMParser().parseFromString(this.rawXml, xmldom_1.default.MIME_TYPE.XML_TEXT);
        this.activeDom = this.dom;
    }
    getWebviews() {
        const nodes = this.xpathQuery('//MockWebView/*[1]');
        return Array.isArray(nodes)
            ? nodes.map((n) => new FakeWebViewImpl(n))
            : [];
    }
    activateWebview(wv) {
        this.activeWebview = wv;
        const fragment = new xmldom_1.default.XMLSerializer().serializeToString(wv.node);
        this.activeDom = new xmldom_1.default.DOMParser().parseFromString(fragment, xmldom_1.default.MIME_TYPE.XML_TEXT);
    }
    deactivateWebview() {
        this.activeWebview = null;
        this.activeDom = this.dom;
    }
    activateFrame(frame) {
        this.activeFrame = frame;
        const fragment = new xmldom_1.default.XMLSerializer().serializeToString(frame);
        this.activeDom = new xmldom_1.default.DOMParser().parseFromString(fragment, xmldom_1.default.MIME_TYPE.XML_TEXT);
    }
    deactivateFrame() {
        this.activeFrame = null;
        if (this.activeWebview) {
            this.activateWebview(this.activeWebview);
        }
    }
    xpathQuery(sel, ctx) {
        const node = ctx ?? this.activeDom;
        return xpath.select(sel, node);
    }
    idQuery(id, ctx) {
        return this.xpathQuery(`//*[@id="${id}"]`, ctx);
    }
    classQuery(className, ctx) {
        return this.xpathQuery(`//${className}`, ctx);
    }
    cssQuery(css, ctx) {
        if (css.startsWith('#')) {
            return this.idQuery(css.slice(1), ctx);
        }
        if (css.startsWith('.')) {
            return this.classQuery(css.slice(1), ctx);
        }
        return this.classQuery(css, ctx);
    }
    hasAlert() {
        return this.activeAlert !== null;
    }
    setAlertText(text) {
        if (!this.activeAlert?.hasPrompt()) {
            throw new Error('No prompt to set text of');
        }
        this.activeAlert?.setAttr('prompt', text);
    }
    showAlert(alertId) {
        const nodes = this.xpathQuery(`//alert[@id="${alertId}"]`);
        if (!Array.isArray(nodes) || nodes.length === 0) {
            throw new Error(`Alert ${alertId} doesn't exist!`);
        }
        this.activeAlert = new fake_element_1.FakeElement(nodes[0], this);
    }
    /** Alert text from prompt attr or node text attr (e.g. <alert text="Fake Alert">). */
    alertText() {
        const prompt = this.activeAlert?.getAttr('prompt');
        if (prompt) {
            return prompt;
        }
        const fromAttrs = this.activeAlert?.nodeAttrs?.text;
        if (fromAttrs) {
            return fromAttrs;
        }
        const node = this.activeAlert?.node;
        return node?.getAttribute?.('text') ?? '';
    }
    handleAlert() {
        this.activeAlert = null;
    }
    getScreenshot() {
        return (0, node_fs_1.readFileSync)(SCREENSHOT, 'base64');
    }
    setDims() {
        const nodes = this.xpathQuery('//app');
        if (!Array.isArray(nodes)) {
            throw new Error('Cannot fetch app dimensions because no corresponding node has been found in the source');
        }
        const app = new fake_element_1.FakeElement(nodes[0], this);
        this._width = parseInt(app.nodeAttrs.width, 10);
        this._height = parseInt(app.nodeAttrs.height, 10);
    }
}
exports.FakeApp = FakeApp;
class FakeWebViewImpl {
    node;
    constructor(node) {
        this.node = node;
    }
}
exports.FakeWebViewImpl = FakeWebViewImpl;
//# sourceMappingURL=fake-app.js.map