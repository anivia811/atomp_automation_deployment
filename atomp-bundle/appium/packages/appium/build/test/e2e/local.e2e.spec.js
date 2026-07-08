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
const utils_1 = require("../../lib/utils");
const YAML = __importStar(require("yaml"));
const constants_1 = require("../../lib/constants");
const helpers_1 = require("../helpers");
const e2e_helpers_1 = require("./e2e-helpers");
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const { expect } = chai_1.default;
chai_1.default.use(chai_as_promised_1.default);
const { MANIFEST_RELATIVE_PATH } = support_1.env;
const testDriverPath = node_path_1.default.dirname((0, helpers_1.resolveFixture)('test-driver/package.json'));
describe('when Appium is a dependency of the current project', function () {
    let hashPath;
    let manifestPath;
    let appiumHomePkgPath;
    let appiumHome;
    let runJson;
    before(async function () {
        appiumHome = await support_1.tempDir.openDir();
    });
    after(async function () {
        await support_1.fs.rimraf(appiumHome);
    });
    async function readManifest() {
        const manifest = await support_1.fs.readFile(manifestPath, 'utf8');
        return YAML.parse(manifest);
    }
    describe('when the project is an extension', function () {
        before(async function () {
            appiumHome = await support_1.tempDir.openDir();
            hashPath = node_path_1.default.join(appiumHome, constants_1.PKG_HASHFILE_RELATIVE_PATH);
            manifestPath = node_path_1.default.join(appiumHome, MANIFEST_RELATIVE_PATH);
            appiumHomePkgPath = node_path_1.default.join(appiumHome, 'package.json');
            runJson = (0, e2e_helpers_1.runAppiumJson)(appiumHome);
            await support_1.fs.copyFile((0, helpers_1.resolveFixture)('test-driver/package.json'), appiumHomePkgPath);
        });
        it('should automatically discover the extension', async function () {
            const res = (await runJson([constants_1.DRIVER_TYPE, constants_1.EXT_SUBCOMMAND_LIST]));
            expect(res).to.have.property('test');
        });
    });
    describe('when the project is not an extension', function () {
        before(async function () {
            appiumHome = await support_1.tempDir.openDir();
            hashPath = node_path_1.default.join(appiumHome, constants_1.PKG_HASHFILE_RELATIVE_PATH);
            manifestPath = node_path_1.default.join(appiumHome, MANIFEST_RELATIVE_PATH);
            appiumHomePkgPath = node_path_1.default.join(appiumHome, 'package.json');
            runJson = (0, e2e_helpers_1.runAppiumJson)(appiumHome);
            await support_1.fs.copyFile((0, helpers_1.resolveFixture)('cli/appium-dependency.package.json'), appiumHomePkgPath);
        });
        describe('without drivers installed', function () {
            it('should list no drivers', async function () {
                const res = (await runJson([constants_1.DRIVER_TYPE, constants_1.EXT_SUBCOMMAND_LIST]));
                expect(Object.values(res).every(({ installed }) => !installed)).to.be.true;
            });
        });
        describe('after a driver is installed', function () {
            before(async function () {
                await (0, e2e_helpers_1.installLocalExtension)(appiumHome, constants_1.DRIVER_TYPE, helpers_1.FAKE_DRIVER_DIR);
            });
            it('should list the driver', async function () {
                const res = (await runJson([constants_1.DRIVER_TYPE, constants_1.EXT_SUBCOMMAND_LIST]));
                expect(res).to.have.property('fake');
            });
            it('should be resolvable from the local directory', async function () {
                await (0, utils_1.resolveFrom)(appiumHome, '@appium/fake-driver/package.json');
            });
        });
        describe('when a driver is installed via npm', function () {
            before(async function () {
                await support_1.fs.rimraf(node_path_1.default.dirname(hashPath));
                await support_1.npm.exec(constants_1.EXT_SUBCOMMAND_INSTALL, [helpers_1.FAKE_DRIVER_DIR], {
                    json: true,
                    cwd: appiumHome,
                });
            });
            describe(constants_1.EXT_SUBCOMMAND_LIST, function () {
                let res;
                beforeEach(async function () {
                    res = (await runJson([constants_1.DRIVER_TYPE, constants_1.EXT_SUBCOMMAND_LIST]));
                });
                it('should list the driver', function () {
                    expect(res).to.have.property('fake');
                });
                it('should update the manifest', async function () {
                    const manifestParsed = await readManifest();
                    expect(manifestParsed).to.have.nested.property('drivers.fake');
                });
                describe('when a different driver is installed via "appium driver install"', function () {
                    before(async function () {
                        await runJson([constants_1.DRIVER_TYPE, constants_1.EXT_SUBCOMMAND_LIST]);
                        await (0, e2e_helpers_1.installLocalExtension)(appiumHome, constants_1.DRIVER_TYPE, testDriverPath);
                    });
                    it('should update package.json', async function () {
                        const newPkg = JSON.parse(await support_1.fs.readFile(appiumHomePkgPath, 'utf8'));
                        expect(newPkg).to.have.nested.property('devDependencies.@appium/test-driver');
                    });
                    it('should update the manifest with the new driver', async function () {
                        const manifest = await support_1.fs.readFile(manifestPath, 'utf8');
                        const manifestParsed = YAML.parse(manifest);
                        expect(manifestParsed).to.have.nested.property('drivers.test');
                        expect(manifestParsed).to.have.nested.property('drivers.fake');
                    });
                    it('should actually install both drivers', async function () {
                        // Resolve package.json to assert the package is present (resolving the main entry can fail in CI)
                        await (0, utils_1.resolveFrom)(appiumHome, '@appium/fake-driver/package.json');
                        await (0, utils_1.resolveFrom)(appiumHome, '@appium/test-driver/package.json');
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=local.e2e.spec.js.map