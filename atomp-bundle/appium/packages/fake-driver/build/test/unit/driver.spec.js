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
const chai_1 = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const lib_1 = require("../../lib");
const helpers_1 = require("../helpers");
const driver_test_support_1 = require("@appium/driver-test-support");
chai_1.default.use(chai_as_promised_1.default);
// test the same things as for base driver
// @ts-expect-error FakeDriver constructor opts differ from DriverClass expectation
(0, driver_test_support_1.driverUnitTestSuite)(lib_1.FakeDriver, structuredClone(helpers_1.W3C_PREFIXED_CAPS));
describe('FakeDriver', function () {
    it('should not start a session when a unique session is already running', async function () {
        const d1 = new lib_1.FakeDriver();
        const [uniqueSession] = await d1.createSession(null, null, {
            alwaysMatch: {
                ...structuredClone(helpers_1.W3C_PREFIXED_CAPS),
                'appium:uniqueApp': true,
            },
            firstMatch: [{}],
        });
        (0, chai_1.expect)(uniqueSession).to.be.a('string');
        const d2 = new lib_1.FakeDriver();
        const otherSessionData = [d1.driverData];
        try {
            await (0, chai_1.expect)(d2.createSession(null, null, structuredClone(helpers_1.W3C_CAPS), otherSessionData)).to.eventually.be.rejectedWith(/unique/);
        }
        finally {
            await d1.deleteSession(uniqueSession);
        }
    });
    it('should start a new session when another non-unique session is running', async function () {
        const d1 = new lib_1.FakeDriver();
        const [session1Id] = await d1.createSession(null, null, structuredClone(helpers_1.W3C_CAPS));
        (0, chai_1.expect)(session1Id).to.be.a('string');
        const d2 = new lib_1.FakeDriver();
        const [session2Id] = await d2.createSession(null, null, structuredClone(helpers_1.W3C_CAPS));
        (0, chai_1.expect)(session2Id).to.be.a('string');
        (0, chai_1.expect)(session1Id).to.not.equal(session2Id);
        await d1.deleteSession(session1Id);
        await d2.deleteSession(session2Id);
    });
});
//# sourceMappingURL=driver.spec.js.map