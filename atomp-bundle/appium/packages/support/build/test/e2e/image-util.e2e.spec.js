"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const sharp_1 = __importDefault(require("sharp"));
const image_util_1 = require("../../lib/image-util");
const lib_1 = require("../../lib");
const FIXTURES_ROOT = node_path_1.default.resolve(__dirname, 'fixture', 'images');
async function getImage(name) {
    const imagePath = node_path_1.default.resolve(FIXTURES_ROOT, name);
    return await lib_1.fs.readFile(imagePath, 'utf8');
}
describe('image-util', function () {
    before(async function () {
        (0, chai_1.use)(chai_as_promised_1.default);
    });
    describe('cropBase64Image', function () {
        let originalImageB64 = null;
        before(async function () {
            originalImageB64 = await getImage('full-image.b64');
        });
        it('should verify that an image is cropped correctly', async function () {
            const croppedImageB64 = await (0, image_util_1.cropBase64Image)(originalImageB64, {
                left: 35,
                top: 107,
                width: 323,
                height: 485,
            });
            const croppedImage = (0, sharp_1.default)(Buffer.from(croppedImageB64, 'base64'));
            const { width, height } = await croppedImage.metadata();
            (0, chai_1.expect)(width).to.equal(323);
            (0, chai_1.expect)(height).to.equal(485);
        });
    });
});
//# sourceMappingURL=image-util.e2e.spec.js.map