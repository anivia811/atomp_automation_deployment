"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const net_1 = require("../../lib/net");
const index_1 = require("../../lib/index");
describe('#net', function () {
    let tmpRoot;
    before(async function () {
        (0, chai_1.use)(chai_as_promised_1.default);
    });
    beforeEach(async function () {
        tmpRoot = await index_1.tempDir.openDir();
    });
    afterEach(async function () {
        await index_1.fs.rimraf(tmpRoot);
    });
    describe('downloadFile()', function () {
        it('should download file into the target folder', async function () {
            const dstPath = node_path_1.default.join(tmpRoot, 'download.tmp');
            await (0, net_1.downloadFile)('https://appium.io/docs/en/2.0/assets/images/appium-logo-white.png', dstPath);
            await (0, chai_1.expect)(index_1.fs.exists(dstPath)).to.eventually.be.true;
        });
    });
});
//# sourceMappingURL=net.e2e.spec.js.map