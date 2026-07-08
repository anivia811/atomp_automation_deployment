"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertNoAlert = assertNoAlert;
exports.assertAlert = assertAlert;
exports.getAlertText = getAlertText;
exports.setAlertText = setAlertText;
exports.postAcceptAlert = postAcceptAlert;
exports.postDismissAlert = postDismissAlert;
const driver_1 = require("appium/driver");
/** Throw if an alert is currently open (blocks other commands). */
function assertNoAlert() {
    if (this.appModel.hasAlert()) {
        throw new driver_1.errors.UnexpectedAlertOpenError();
    }
}
/** Throw if no alert is open (required before get/set alert text, accept, etc.). */
function assertAlert() {
    if (!this.appModel.hasAlert()) {
        throw new driver_1.errors.NoAlertOpenError();
    }
}
/** getAlertText. */
async function getAlertText() {
    this.assertAlert();
    return this.appModel.alertText();
}
/** setAlertText. */
async function setAlertText(text) {
    this.assertAlert();
    try {
        this.appModel.setAlertText(text);
    }
    catch {
        throw new driver_1.errors.InvalidElementStateError();
    }
}
/** postAcceptAlert. */
async function postAcceptAlert() {
    this.assertAlert();
    this.appModel.handleAlert();
}
/** In this fake, dismiss is the same as accept. */
async function postDismissAlert() {
    return this.postAcceptAlert();
}
//# sourceMappingURL=alert.js.map