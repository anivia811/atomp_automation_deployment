"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WD_OPTS = exports.W3C_PREFIXED_CAPS = exports.W3C_CAPS = exports.BASE_CAPS = exports.TEST_PORT = exports.TEST_HOST = exports.TEST_APP = void 0;
exports.initSession = initSession;
exports.deleteSession = deleteSession;
const node_path_1 = __importDefault(require("node:path"));
const webdriverio_1 = require("webdriverio");
const TEST_HOST = '127.0.0.1';
exports.TEST_HOST = TEST_HOST;
const TEST_PORT = 4774;
exports.TEST_PORT = TEST_PORT;
const TEST_APP = node_path_1.default.join(__dirname, 'fixtures', 'app.xml');
exports.TEST_APP = TEST_APP;
const BASE_CAPS = {
    platformName: 'Fake',
    deviceName: 'Commodore 64',
    app: TEST_APP,
    address: TEST_HOST,
    port: 8181,
};
exports.BASE_CAPS = BASE_CAPS;
const W3C_PREFIXED_CAPS = {
    'appium:deviceName': BASE_CAPS.deviceName,
    'appium:app': BASE_CAPS.app,
    'appium:address': BASE_CAPS.address,
    'appium:port': BASE_CAPS.port,
    platformName: BASE_CAPS.platformName,
};
exports.W3C_PREFIXED_CAPS = W3C_PREFIXED_CAPS;
const W3C_CAPS = {
    alwaysMatch: { ...W3C_PREFIXED_CAPS },
    firstMatch: [{}],
};
exports.W3C_CAPS = W3C_CAPS;
const WD_OPTS = {
    hostname: TEST_HOST,
    port: TEST_PORT,
    connectionRetryCount: 0,
    logLevel: 'error',
};
exports.WD_OPTS = WD_OPTS;
async function initSession(w3cPrefixedCaps) {
    return await (0, webdriverio_1.remote)({ ...WD_OPTS, capabilities: w3cPrefixedCaps });
}
async function deleteSession(driver) {
    try {
        await driver.deleteSession();
    }
    catch {
        // ignore
    }
}
//# sourceMappingURL=helpers.js.map