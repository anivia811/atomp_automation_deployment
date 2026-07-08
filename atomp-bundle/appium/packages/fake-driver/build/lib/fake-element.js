"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeElement = void 0;
const xmldom_1 = __importDefault(require("@xmldom/xmldom"));
/** Wrapper around an XML node from the fake app DOM; supports attrs, css, visibility, click, alerts. */
class FakeElement {
    app;
    type;
    nodeAttrs;
    node;
    attrs;
    css;
    constructor(xmlNode, app) {
        this.app = app;
        this.node = xmlNode;
        this.nodeAttrs = {};
        this.type = xmlNode.tagName;
        this.attrs = {};
        this.css = {};
        // Support both DOM Attr (name/value) and nodeName/nodeValue (e.g. @xmldom/xmldom).
        const attrs = this.node.attributes;
        for (const attr of Object.values(attrs)) {
            const name = attr.name ?? attr.nodeName ?? '';
            const value = attr.value ?? attr.nodeValue ?? '';
            if (name) {
                this.nodeAttrs[name] = value;
            }
        }
        this.parseCss();
    }
    get tagName() {
        return this.node.tagName;
    }
    get xmlFragment() {
        const frag = new xmldom_1.default.XMLSerializer().serializeToString(this.node);
        return new xmldom_1.default.DOMParser().parseFromString(frag, xmldom_1.default.MIME_TYPE.XML_TEXT);
    }
    setAttr(k, v) {
        this.attrs[k] = v;
    }
    getAttr(k) {
        return this.attrs[k] || '';
    }
    isVisible() {
        return this.nodeAttrs.visible !== 'false';
    }
    isEnabled() {
        return this.nodeAttrs.enabled !== 'false';
    }
    isSelected() {
        return this.nodeAttrs.selected === 'true';
    }
    getLocation() {
        return {
            x: parseFloat(this.nodeAttrs.left || '0'),
            y: parseFloat(this.nodeAttrs.top || '0'),
        };
    }
    getElementRect() {
        return { ...this.getLocation(), ...this.getSize() };
    }
    getSize() {
        return {
            width: parseFloat(this.nodeAttrs.width || '0'),
            height: parseFloat(this.nodeAttrs.height || '0'),
        };
    }
    click() {
        const curClicks = Number(this.getAttr('clicks') || 0);
        this.setAttr('clicks', String(curClicks + 1));
        const alertId = this.nodeAttrs.showAlert;
        if (alertId) {
            this.app.showAlert(alertId);
        }
    }
    equals(other) {
        return this.node === other.node;
    }
    hasPrompt() {
        return this.nodeAttrs.hasPrompt === 'true';
    }
    getCss(prop) {
        if (prop in this.css) {
            return this.css[prop];
        }
        return null;
    }
    parseCss() {
        if (this.nodeAttrs.style) {
            const segments = this.nodeAttrs.style.split(';');
            for (const s of segments) {
                let [prop, val] = s.split(':');
                prop = prop.trim();
                val = val.trim();
                this.css[prop] = val;
            }
        }
    }
}
exports.FakeElement = FakeElement;
//# sourceMappingURL=fake-element.js.map