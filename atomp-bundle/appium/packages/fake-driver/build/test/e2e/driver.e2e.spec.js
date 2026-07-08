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
const axios_1 = __importDefault(require("axios"));
const chai_1 = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const driver_test_support_1 = require("@appium/driver-test-support");
const index_1 = require("../../lib/index");
const helpers_1 = require("../helpers");
const context_tests_1 = require("./context-tests");
const find_element_tests_1 = require("./find-element-tests");
const element_interaction_tests_1 = require("./element-interaction-tests");
const alert_tests_1 = require("./alert-tests");
const general_tests_1 = require("./general-tests");
chai_1.default.use(chai_as_promised_1.default);
const shouldStartServer = process.env.USE_RUNNING_SERVER !== '0';
// test the same things as for base driver
// @ts-expect-error FakeDriver constructor opts differ from DriverClass expectation
(0, driver_test_support_1.driverE2ETestSuite)(index_1.FakeDriver, helpers_1.W3C_PREFIXED_CAPS);
describe('FakeDriver - via HTTP', function () {
    let server = null;
    before(async function () {
        if (shouldStartServer) {
            server = await (0, index_1.startServer)(helpers_1.TEST_PORT, helpers_1.TEST_HOST);
        }
    });
    after(function () {
        if (server) {
            server.close();
        }
    });
    describe('session handling', function () {
        it('should start and stop a session', async function () {
            const driver = await (0, helpers_1.initSession)(helpers_1.W3C_PREFIXED_CAPS);
            (0, chai_1.expect)(driver.sessionId).to.exist;
            (0, chai_1.expect)(driver.sessionId).to.be.a('string');
            await (0, helpers_1.deleteSession)(driver);
            await (0, chai_1.expect)(driver.getTitle()).to.be.rejected;
        });
    });
    describe('session-based tests', function () {
        (0, context_tests_1.contextTests)();
        (0, find_element_tests_1.findElementTests)();
        (0, element_interaction_tests_1.elementTests)();
        (0, alert_tests_1.alertTests)();
        (0, general_tests_1.generalTests)();
    });
    describe('w3c', function () {
        it('should return value.capabilities object for W3C', async function () {
            const res = await axios_1.default.post(`http://${helpers_1.TEST_HOST}:${helpers_1.TEST_PORT}/session`, {
                capabilities: {
                    alwaysMatch: helpers_1.W3C_PREFIXED_CAPS,
                    firstMatch: [{ 'appium:fakeCap': 'Foo' }],
                },
            });
            const { value, status } = res.data;
            (0, chai_1.expect)(value.capabilities).to.deep.equal({ ...helpers_1.BASE_CAPS, fakeCap: 'Foo' });
            (0, chai_1.expect)(value.sessionId).to.exist;
            (0, chai_1.expect)(status).to.not.exist;
            await axios_1.default.delete(`http://${helpers_1.TEST_HOST}:${helpers_1.TEST_PORT}/session/${value.sessionId}`);
        });
        it('should fail if given unsupported desiredCapabilities', async function () {
            await (0, chai_1.expect)(axios_1.default.post(`http://${helpers_1.TEST_HOST}:${helpers_1.TEST_PORT}/session`, {
                desiredCapabilities: helpers_1.W3C_PREFIXED_CAPS,
            })).to.eventually.be.rejectedWith(/500/);
        });
    });
});
//# sourceMappingURL=driver.e2e.spec.js.map