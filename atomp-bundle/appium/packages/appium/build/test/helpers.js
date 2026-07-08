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
exports.APPIUM_ROOT = exports.FAKE_PLUGIN_DIR = exports.FAKE_DRIVER_DIR = exports.rewiremock = exports.PROJECT_ROOT = exports.W3C_CAPS = exports.W3C_PREFIXED_CAPS = exports.BASE_CAPS = exports.TEST_HOST = exports.TEST_FAKE_APP = void 0;
exports.getTestPort = getTestPort;
exports.resolveFixture = resolveFixture;
const node_net_1 = __importDefault(require("node:net"));
const node_path_1 = __importDefault(require("node:path"));
const rewiremock_1 = __importStar(require("rewiremock"));
exports.rewiremock = rewiremock_1.default;
const capability_1 = require("../lib/helpers/capability");
const TEST_HOST = '127.0.0.1';
exports.TEST_HOST = TEST_HOST;
const FAKE_DRIVER_DIR = node_path_1.default.dirname(require.resolve('@appium/fake-driver/package.json'));
exports.FAKE_DRIVER_DIR = FAKE_DRIVER_DIR;
const FAKE_PLUGIN_DIR = node_path_1.default.dirname(require.resolve('@appium/fake-plugin/package.json'));
exports.FAKE_PLUGIN_DIR = FAKE_PLUGIN_DIR;
/** This is the monorepo root. */
const PROJECT_ROOT = node_path_1.default.join(FAKE_DRIVER_DIR, '..', '..');
exports.PROJECT_ROOT = PROJECT_ROOT;
/** Path to Appium package */
const APPIUM_ROOT = node_path_1.default.join(PROJECT_ROOT, 'packages', 'appium');
exports.APPIUM_ROOT = APPIUM_ROOT;
/** Path to fake app fixture `.xml` (as understood by `FakeDriver`) */
const TEST_FAKE_APP = node_path_1.default.join(FAKE_DRIVER_DIR, 'test', 'fixtures', 'app.xml');
exports.TEST_FAKE_APP = TEST_FAKE_APP;
const BASE_CAPS = {
    automationName: 'Fake',
    platformName: 'Fake',
    deviceName: 'Fake',
    app: TEST_FAKE_APP,
};
exports.BASE_CAPS = BASE_CAPS;
const W3C_PREFIXED_CAPS = { ...(0, capability_1.insertAppiumPrefixes)(BASE_CAPS) };
exports.W3C_PREFIXED_CAPS = W3C_PREFIXED_CAPS;
const W3C_CAPS = {
    alwaysMatch: { ...W3C_PREFIXED_CAPS },
    firstMatch: [{}],
};
exports.W3C_CAPS = W3C_CAPS;
let TEST_PORT;
async function getPort() {
    const server = node_net_1.default.createServer();
    return await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, () => {
            const address = server.address();
            if (!address || typeof address === 'string') {
                server.close(() => reject(new Error('Could not resolve a free port')));
                return;
            }
            server.close((err) => (err ? reject(err) : resolve(address.port)));
        });
    });
}
async function getTestPort() {
    return (TEST_PORT ??= await getPort());
}
function resolveFixture(filename, ...pathParts) {
    return node_path_1.default.join(__dirname, 'fixtures', filename, ...pathParts);
}
(0, rewiremock_1.overrideEntryPoint)(module);
(0, rewiremock_1.addPlugin)(rewiremock_1.plugins.nodejs);
//# sourceMappingURL=helpers.js.map