"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.title = title;
exports.keys = keys;
exports.setGeoLocation = setGeoLocation;
exports.getGeoLocation = getGeoLocation;
exports.getPageSource = getPageSource;
exports.getOrientation = getOrientation;
exports.setOrientation = setOrientation;
exports.getScreenshot = getScreenshot;
exports.getWindowSize = getWindowSize;
exports.getWindowRect = getWindowRect;
exports.performActions = performActions;
exports.releaseActions = releaseActions;
exports.getLog = getLog;
exports.mobileShake = mobileShake;
exports.doubleClick = doubleClick;
exports.execute = execute;
exports.fakeAddition = fakeAddition;
exports.getUrl = getUrl;
exports.bidiNavigate = bidiNavigate;
exports.getLastPluginMath = getLastPluginMath;
const driver_1 = require("appium/driver");
const ORIENTATIONS = new Set(['LANDSCAPE', 'PORTRAIT']);
/** Requires webview context (title comes from active document). */
async function title() {
    this.assertWebviewContext();
    return this.appModel.title;
}
/** keys. */
async function keys(value) {
    if (!this.focusedElId) {
        throw new driver_1.errors.InvalidElementStateError();
    }
    await this.setValue(value, this.focusedElId);
}
/** setGeoLocation. */
async function setGeoLocation(location) {
    this.appModel.lat = location.latitude;
    this.appModel.long = location.longitude;
    return location;
}
/** getGeoLocation. */
async function getGeoLocation() {
    return this.appModel.currentGeoLocation;
}
/** getPageSource. */
async function getPageSource() {
    return this.appModel.rawXml;
}
/** getOrientation. */
async function getOrientation() {
    return this.appModel.orientation;
}
/** setOrientation. */
async function setOrientation(o) {
    if (!ORIENTATIONS.has(o)) {
        throw new driver_1.errors.UnknownError('Orientation must be LANDSCAPE or PORTRAIT');
    }
    this.appModel.orientation = o;
}
/** getScreenshot. */
async function getScreenshot() {
    return this.appModel.getScreenshot();
}
/** getWindowSize. */
async function getWindowSize() {
    return { width: this.appModel.width, height: this.appModel.height };
}
/** getWindowRect. */
async function getWindowRect() {
    return { width: this.appModel.width, height: this.appModel.height, x: 0, y: 0 };
}
/** performActions. */
async function performActions(actions) {
    this.appModel.actionLog.push(actions);
}
/** releaseActions. */
async function releaseActions() { }
/** Supported log types: 'actions'. TODO: add more log types if needed for tests. */
async function getLog(type) {
    switch (type) {
        case 'actions':
            return this.appModel.actionLog;
        default:
            throw new Error(`Don't understand log type '${type}'`);
    }
}
/** mobileShake. */
async function mobileShake() {
    this.shook = true;
}
/** doubleClick. */
async function doubleClick() { }
/** execute. */
async function execute(script, args) {
    return await this.executeMethod(script, args);
}
/** fakeAddition. */
async function fakeAddition(num1, num2, num3 = 0) {
    return num1 + num2 + (num3 ?? 0);
}
/** Get current URL. Returns empty string until bidiNavigate (or equivalent) sets one. @see https://w3c.github.io/webdriver/#get-current-url */
async function getUrl() {
    return this.url ?? '';
}
/** Set current URL (used by Bidi browsingContext.navigate). */
async function bidiNavigate(context, url) {
    this.url = url;
}
/** Return the last math result detected by a plugin that publishes it */
async function getLastPluginMath() {
    return this.lastPluginMath;
}
//# sourceMappingURL=general.js.map