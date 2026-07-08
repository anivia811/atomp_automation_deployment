"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findElOrEls = void 0;
exports.getExistingElementForNode = getExistingElementForNode;
exports.wrapNewEl = wrapNewEl;
exports.findElement = findElement;
exports.findElements = findElements;
exports.findElementFromElement = findElementFromElement;
exports.findElementsFromElement = findElementsFromElement;
const driver_1 = require("appium/driver");
const fake_element_1 = require("../fake-element");
const support_1 = require("appium/support");
const { W3C_WEB_ELEMENT_IDENTIFIER } = support_1.util;
/** Find an existing element id in elMap for the same underlying node (reference equality). */
function getExistingElementForNode(node) {
    for (const [id, el] of Object.entries(this.elMap)) {
        if (el.node === node.node) {
            return id;
        }
    }
    return null;
}
/** Accepts either a FakeElement (reuse existing id) or a raw XmlNodeLike from xpath. */
function wrapNewEl(obj) {
    const node = obj instanceof fake_element_1.FakeElement ? obj.node : obj;
    if (obj instanceof fake_element_1.FakeElement) {
        const existingElId = this.getExistingElementForNode(obj);
        if (existingElId) {
            return { ELEMENT: existingElId, [W3C_WEB_ELEMENT_IDENTIFIER]: existingElId };
        }
    }
    else {
        // raw node: reuse id if we already have an element for this node
        for (const [id, el] of Object.entries(this.elMap)) {
            if (el.node === node) {
                return { ELEMENT: id, [W3C_WEB_ELEMENT_IDENTIFIER]: id };
            }
        }
    }
    this.maxElId++;
    const maxElId = this.maxElId.toString();
    this.elMap[maxElId] = new fake_element_1.FakeElement(node, this.appModel);
    return { ELEMENT: maxElId, [W3C_WEB_ELEMENT_IDENTIFIER]: maxElId };
}
/** findElOrElsImpl. */
async function findElOrElsImpl(strategy, selector, mult, context) {
    // Map WebDriver locator strategy to FakeApp query method name.
    const qMap = {
        xpath: 'xpathQuery',
        id: 'idQuery',
        'accessibility id': 'idQuery',
        'class name': 'classQuery',
        'tag name': 'classQuery',
        'css selector': 'cssQuery',
    };
    if (!(strategy in qMap)) {
        throw new driver_1.errors.UnknownCommandError();
    }
    if (selector === 'badsel') {
        throw new driver_1.errors.InvalidSelectorError();
    }
    const methodName = qMap[strategy];
    const raw = this.appModel[methodName].call(this.appModel, selector, context);
    let els = [];
    if (Array.isArray(raw)) {
        els = raw;
    }
    else if (raw) {
        els = [raw];
    }
    if (els.length) {
        if (mult) {
            return els.map((el) => this.wrapNewEl(el));
        }
        return this.wrapNewEl(els[0]);
    }
    if (mult) {
        return [];
    }
    throw new driver_1.errors.NoSuchElementError();
}
exports.findElOrEls = findElOrElsImpl;
/** findElement. */
async function findElement(strategy, selector) {
    return this.findElOrEls(strategy, selector, false);
}
// Protocol passes (strategy, selector, elementId) for find-from-element routes.
/** findElements. */
async function findElements(strategy, selector) {
    return this.findElOrEls(strategy, selector, true);
}
/** findElementFromElement. */
async function findElementFromElement(strategy, selector, elementId) {
    const el = this.getElement(elementId);
    return this.findElOrEls(strategy, selector, false, el.xmlFragment);
}
/** findElementsFromElement. */
async function findElementsFromElement(strategy, selector, elementId) {
    const el = this.getElement(elementId);
    return this.findElOrEls(strategy, selector, true, el.xmlFragment);
}
//# sourceMappingURL=find.js.map