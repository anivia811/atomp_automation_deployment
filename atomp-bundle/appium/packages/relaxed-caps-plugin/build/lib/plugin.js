"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelaxedCapsPlugin = void 0;
const plugin_1 = require("appium/plugin");
const driver_1 = require("appium/driver");
const VENDOR_PREFIX = 'appium';
const HAS_VENDOR_PREFIX_RE = /^.+:/;
class RelaxedCapsPlugin extends plugin_1.BasePlugin {
    async createSession(next, driver, caps1, caps2, caps3, ...restArgs) {
        const patchedCaps = [caps1, caps2, caps3].map((c) => isPlainObject(c) ? this.fixCapsIfW3C(c) : c);
        return await driver.createSession(...patchedCaps, ...restArgs);
    }
    fixCapsIfW3C(caps) {
        if (!this.isW3cCaps(caps)) {
            return caps;
        }
        const w3c = structuredClone(caps);
        if (Array.isArray(w3c.firstMatch)) {
            w3c.firstMatch = w3c.firstMatch.map((c) => this.addVendorPrefix(c));
        }
        if (isPlainObject(w3c.alwaysMatch)) {
            w3c.alwaysMatch = this.addVendorPrefix(w3c.alwaysMatch);
        }
        return w3c;
    }
    isW3cCaps(caps) {
        if (!isPlainObject(caps)) {
            return false;
        }
        const isFirstMatchValid = () => {
            const firstMatch = caps.firstMatch;
            return Array.isArray(firstMatch) && firstMatch.length > 0 && firstMatch.every(isPlainObject);
        };
        const isAlwaysMatchValid = () => isPlainObject(caps.alwaysMatch);
        if (Object.hasOwn(caps, 'firstMatch') && Object.hasOwn(caps, 'alwaysMatch')) {
            return isFirstMatchValid() && isAlwaysMatchValid();
        }
        if (Object.hasOwn(caps, 'firstMatch')) {
            return isFirstMatchValid();
        }
        if (Object.hasOwn(caps, 'alwaysMatch')) {
            return isAlwaysMatchValid();
        }
        return false;
    }
    addVendorPrefix(caps) {
        const newCaps = {};
        if (!isPlainObject(caps)) {
            return caps;
        }
        const adjustedKeys = [];
        for (const key of Object.keys(caps)) {
            if ((0, driver_1.isStandardCap)(key) || HAS_VENDOR_PREFIX_RE.test(key)) {
                newCaps[key] = caps[key];
            }
            else {
                newCaps[`${VENDOR_PREFIX}:${key}`] = caps[key];
                adjustedKeys.push(key);
            }
        }
        if (adjustedKeys.length) {
            this.log.info(`Adjusted keys to conform to capability prefix requirements: ` +
                JSON.stringify(adjustedKeys));
        }
        return newCaps;
    }
}
exports.RelaxedCapsPlugin = RelaxedCapsPlugin;
function isPlainObject(value) {
    if (value === null || typeof value !== 'object') {
        return false;
    }
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || prototype === Object.prototype;
}
//# sourceMappingURL=plugin.js.map