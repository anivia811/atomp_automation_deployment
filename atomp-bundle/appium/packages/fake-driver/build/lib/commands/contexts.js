"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRawContexts = getRawContexts;
exports.assertWebviewContext = assertWebviewContext;
exports.getCurrentContext = getCurrentContext;
exports.getContexts = getContexts;
exports.setContext = setContext;
exports.setFrame = setFrame;
const driver_1 = require("appium/driver");
/** NATIVE_APP, PROXY, and WEBVIEW_1, WEBVIEW_2, ... from app model. */
function getRawContexts() {
    const contexts = { NATIVE_APP: null, PROXY: null };
    const wvs = this.appModel.getWebviews() ?? [];
    for (let i = 1; i < wvs.length + 1; i++) {
        contexts[`WEBVIEW_${i}`] = wvs[i - 1];
    }
    return contexts;
}
/** Throw if current context is NATIVE_APP (e.g. CSS/title require a webview). */
function assertWebviewContext() {
    if (this.curContext === 'NATIVE_APP') {
        throw new driver_1.errors.InvalidContextError();
    }
}
/** getCurrentContext. */
async function getCurrentContext() {
    return this.curContext;
}
/** getContexts. */
async function getContexts() {
    return Object.keys(this.getRawContexts());
}
/** setContext. */
async function setContext(context) {
    const contexts = this.getRawContexts();
    if (context in contexts) {
        this.curContext = context;
        if (context === 'NATIVE_APP') {
            this.appModel.deactivateWebview();
            this._proxyActive = false;
        }
        else if (context === 'PROXY') {
            this._proxyActive = true;
        }
        else {
            this.appModel.activateWebview(contexts[context]);
            this._proxyActive = false;
        }
    }
    else {
        throw new driver_1.errors.NoSuchContextError();
    }
}
/** setFrame. */
async function setFrame(frameId) {
    this.assertWebviewContext();
    if (frameId === null) {
        this.appModel.deactivateFrame();
    }
    else {
        const nodes = this.appModel.xpathQuery(`//iframe[@id="${frameId}"]`);
        if (!Array.isArray(nodes) || nodes.length === 0) {
            throw new driver_1.errors.NoSuchFrameError();
        }
        this.appModel.activateFrame(nodes[0]);
    }
}
//# sourceMappingURL=contexts.js.map