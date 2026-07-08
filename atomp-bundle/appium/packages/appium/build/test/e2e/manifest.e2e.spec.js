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
const support_1 = require("@appium/support");
const node_path_1 = __importDefault(require("node:path"));
const YAML = __importStar(require("yaml"));
const constants_1 = require("../../lib/constants");
const helpers_1 = require("../helpers");
const e2e_helpers_1 = require("./e2e-helpers");
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const { expect } = chai_1.default;
chai_1.default.use(chai_as_promised_1.default);
describe('manifest handling', function () {
    let appiumHome;
    let manifestPath;
    let runList;
    async function resetAppiumHome() {
        await support_1.fs.rimraf(appiumHome);
        await support_1.fs.mkdirp(appiumHome);
    }
    before(async function () {
        appiumHome = await support_1.tempDir.openDir();
        manifestPath = node_path_1.default.join(appiumHome, constants_1.CACHE_DIR_RELATIVE_PATH, 'extensions.yaml');
        const run = (0, e2e_helpers_1.runAppiumJson)(appiumHome);
        runList = async (args = []) => run([constants_1.DRIVER_TYPE, constants_1.EXT_SUBCOMMAND_LIST, ...args]);
    });
    async function readManifest() {
        return YAML.parse(await support_1.fs.readFile(manifestPath, 'utf8'));
    }
    after(async function () {
        await support_1.fs.rimraf(appiumHome);
    });
    describe('migration', function () {
        beforeEach(async function () {
            await resetAppiumHome();
            await support_1.fs.mkdirp(node_path_1.default.dirname(manifestPath));
        });
        describe('schema rev update', function () {
            beforeEach(async function () {
                await support_1.fs.copyFile((0, helpers_1.resolveFixture)('manifest/v2-empty.yaml'), manifestPath);
            });
            it('should update the manifest file to the latest schema revision', async function () {
                await runList();
                const manifest = await readManifest();
                expect(manifest.schemaRev).to.equal(constants_1.CURRENT_SCHEMA_REV);
            });
        });
        describe('v3', function () {
            let manifest;
            before(async function () {
                await (0, e2e_helpers_1.installLocalExtension)(appiumHome, constants_1.DRIVER_TYPE, helpers_1.FAKE_DRIVER_DIR);
                const list = await runList();
                expect(list.fake).to.exist;
                let tmpManifest = await readManifest();
                tmpManifest.schemaRev = 2;
                const drivers = tmpManifest.drivers;
                if (drivers?.fake) {
                    delete drivers.fake.installPath;
                }
                await support_1.fs.writeFile(manifestPath, YAML.stringify(tmpManifest));
                tmpManifest = await readManifest();
                expect(tmpManifest.schemaRev).to.equal(2);
                expect(tmpManifest.drivers?.fake?.installPath)
                    .to.not.exist;
                await runList();
                manifest = await readManifest();
            });
            it('should add an "installPath" field to each extension', function () {
                const drivers = manifest.drivers;
                expect(drivers?.fake?.installPath).to.be.a('string');
            });
            it('should update the manifest file to the latest schema revision', function () {
                expect(manifest.schemaRev).to.equal(constants_1.CURRENT_SCHEMA_REV);
            });
        });
    });
});
//# sourceMappingURL=manifest.e2e.spec.js.map