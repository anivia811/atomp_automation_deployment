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
const node_path_1 = __importDefault(require("node:path"));
const support_1 = require("@appium/support");
const deploy_1 = require("../../lib/builder/deploy");
const constants_1 = require("../../lib/constants");
const chai = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
chai.use(chai_as_promised_1.default);
const { expect } = chai;
/**
 * Helper function to create a project directory with package.json
 */
async function createPackageJson(testDir, packageJson) {
    await support_1.fs.mkdirp(testDir);
    const packageJsonPath = node_path_1.default.join(testDir, constants_1.NAME_PACKAGE_JSON);
    await support_1.fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    return packageJsonPath;
}
describe('findDeployVersion', function () {
    let testDir;
    let packageJsonPath;
    before(async function () {
        testDir = await support_1.tempDir.openDir();
        packageJsonPath = await createPackageJson(testDir, {
            version: '2.3.8',
        });
    });
    after(async function () {
        if (testDir) {
            await support_1.fs.rimraf(testDir);
        }
    });
    it('should use MAJOR.MINOR version by default', async function () {
        expect(await (0, deploy_1.findDeployVersion)(packageJsonPath)).to.equal('2.3');
    });
    it('should use prefixed MAJOR version if usePrefixedMajorVersion is used', async function () {
        expect(await (0, deploy_1.findDeployVersion)(packageJsonPath, true)).to.equal('v2');
    });
    it('should support custom working directory', async function () {
        expect(await (0, deploy_1.findDeployVersion)(undefined, false, testDir)).to.equal('2.3');
    });
});
//# sourceMappingURL=builder.spec.js.map