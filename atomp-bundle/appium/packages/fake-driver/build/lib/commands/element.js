"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElements = getElements;
exports.getElement = getElement;
exports.getName = getName;
exports.elementDisplayed = elementDisplayed;
exports.elementEnabled = elementEnabled;
exports.elementSelected = elementSelected;
exports.setValue = setValue;
exports.getText = getText;
exports.clear = clear;
exports.click = click;
exports.getAttribute = getAttribute;
exports.getElementRect = getElementRect;
exports.getSize = getSize;
exports.equalsElement = equalsElement;
exports.getCssProperty = getCssProperty;
exports.getLocation = getLocation;
exports.getLocationInView = getLocationInView;
const driver_1 = require("appium/driver");
/** Resolve element ids to FakeElements; throws StaleElementReferenceError if any id is missing. */
function getElements(elementIds) {
    for (const elId of elementIds) {
        if (!(elId in this.elMap)) {
            throw new driver_1.errors.StaleElementReferenceError();
        }
    }
    return elementIds.map((e) => this.elMap[e]);
}
/** getElement. */
function getElement(elementId) {
    return this.getElements([elementId])[0];
}
/** getName. */
async function getName(elementId) {
    const el = this.getElement(elementId);
    return el.tagName;
}
/** elementDisplayed. */
async function elementDisplayed(elementId) {
    const el = this.getElement(elementId);
    return el.isVisible();
}
/** elementEnabled. */
async function elementEnabled(elementId) {
    const el = this.getElement(elementId);
    return el.isEnabled();
}
/** elementSelected. */
async function elementSelected(elementId) {
    const el = this.getElement(elementId);
    return el.isSelected();
}
/** setValue. */
async function setValue(keys, elementId) {
    const value = Array.isArray(keys) ? keys.join('') : keys;
    const el = this.getElement(elementId);
    // Only MockInputField supports value in the fake app XML.
    if (el.type !== 'MockInputField') {
        throw new driver_1.errors.InvalidElementStateError();
    }
    el.setAttr('value', value);
}
/** getText. */
async function getText(elementId) {
    const el = this.getElement(elementId);
    return el.getAttr('value');
}
/** clear. */
async function clear(elementId) {
    await this.setValue('', elementId);
}
/** click. */
async function click(elementId) {
    this.assertNoAlert();
    const el = this.getElement(elementId);
    if (!el.isVisible()) {
        throw new driver_1.errors.InvalidElementStateError();
    }
    el.click();
    this.focusedElId = elementId;
}
/** Protocol order: attribute name, then element id (from route /attribute/:name). */
async function getAttribute(attributeName, elementId) {
    const el = this.getElement(elementId);
    return el.getAttr(attributeName);
}
/** getElementRect. */
async function getElementRect(elementId) {
    const el = this.getElement(elementId);
    return el.getElementRect();
}
/** getSize. */
async function getSize(elementId) {
    const el = this.getElement(elementId);
    return el.getSize();
}
/** equalsElement. */
async function equalsElement(elementIdA, elementIdB) {
    const el1 = this.getElement(elementIdA);
    const el2 = this.getElement(elementIdB);
    return el1.equals(el2);
}
/** Protocol order: property name, then element id. Requires webview context. */
async function getCssProperty(propertyName, elementId) {
    this.assertWebviewContext();
    const el = this.getElement(elementId);
    return el.getCss(propertyName) ?? '';
}
/** getLocation. */
async function getLocation(elementId) {
    const el = this.getElement(elementId);
    return el.getLocation();
}
/** getLocationInView. */
async function getLocationInView(elementId) {
    return this.getLocation(elementId);
}
//# sourceMappingURL=element.js.map