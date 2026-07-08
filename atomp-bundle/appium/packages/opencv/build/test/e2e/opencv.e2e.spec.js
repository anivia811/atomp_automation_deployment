"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../../lib");
const node_path_1 = __importDefault(require("node:path"));
const support_1 = require("@appium/support");
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
(0, chai_1.use)(chai_as_promised_1.default);
const FIXTURES_ROOT = node_path_1.default.resolve(__dirname, 'images');
describe('OpenCV helpers', function () {
    // OpenCV needs several seconds for initialization
    this.timeout(120000);
    let imgFixture = null;
    let fullImage = null;
    let partialImage = null;
    let originalImage = null;
    let changedImage = null;
    let rotatedImage = null;
    let numberImage = null;
    before(async function () {
        const imagePath = node_path_1.default.resolve(FIXTURES_ROOT, 'full-image.b64');
        imgFixture = Buffer.from(await support_1.fs.readFile(imagePath, 'binary'), 'base64');
        fullImage = await support_1.fs.readFile(node_path_1.default.resolve(FIXTURES_ROOT, 'findwaldo.jpg'));
        partialImage = await support_1.fs.readFile(node_path_1.default.resolve(FIXTURES_ROOT, 'waldo.jpg'));
        originalImage = await support_1.fs.readFile(node_path_1.default.resolve(FIXTURES_ROOT, 'cc1.png'));
        changedImage = await support_1.fs.readFile(node_path_1.default.resolve(FIXTURES_ROOT, 'cc2.png'));
        numberImage = await support_1.fs.readFile(node_path_1.default.resolve(FIXTURES_ROOT, 'number5.png'));
        rotatedImage = await support_1.fs.readFile(node_path_1.default.resolve(FIXTURES_ROOT, 'cc_rotated.png'));
    });
    describe('getImagesMatches', function () {
        it('should calculate the number of matches between two images', async function () {
            for (const detectorName of ['AKAZE', 'ORB']) {
                const { count, totalCount } = await (0, lib_1.getImagesMatches)(fullImage, fullImage, { detectorName });
                (0, chai_1.expect)(count).to.be.above(0);
                (0, chai_1.expect)(totalCount).to.eql(count);
            }
        });
        it('should visualize matches between two images', async function () {
            const { visualization } = await (0, lib_1.getImagesMatches)(fullImage, fullImage, {
                visualize: true,
            });
            (0, chai_1.expect)(visualization).to.not.be.empty;
        });
        it('should visualize matches between two images and apply goodMatchesFactor', async function () {
            const { visualization, points1, rect1, points2, rect2 } = await (0, lib_1.getImagesMatches)(rotatedImage, originalImage, {
                visualize: true,
                matchFunc: 'BruteForceHamming',
                goodMatchesFactor: 40,
            });
            (0, chai_1.expect)(visualization).to.not.be.empty;
            (0, chai_1.expect)(points1.length).to.be.above(4);
            (0, chai_1.expect)(rect1.x).to.be.above(0);
            (0, chai_1.expect)(rect1.y).to.be.above(0);
            (0, chai_1.expect)(rect1.width).to.be.above(0);
            (0, chai_1.expect)(rect1.height).to.be.above(0);
            (0, chai_1.expect)(points2.length).to.be.above(4);
            (0, chai_1.expect)(rect2.x).to.be.above(0);
            (0, chai_1.expect)(rect2.y).to.be.above(0);
            (0, chai_1.expect)(rect2.width).to.be.above(0);
            (0, chai_1.expect)(rect2.height).to.be.above(0);
        });
    });
    describe('getImagesSimilarity', function () {
        it('should calculate the similarity score between two images', async function () {
            const { score } = await (0, lib_1.getImagesSimilarity)(imgFixture, imgFixture);
            (0, chai_1.expect)(score).to.be.above(0);
        });
        it('should visualize the similarity between two images', async function () {
            const { visualization } = await (0, lib_1.getImagesSimilarity)(originalImage, changedImage, {
                visualize: true,
            });
            (0, chai_1.expect)(visualization).to.not.be.empty;
        });
    });
    describe('getImageOccurrence', function () {
        it('should calculate the partial image position in the full image', async function () {
            const { rect, score } = await (0, lib_1.getImageOccurrence)(fullImage, partialImage);
            (0, chai_1.expect)(rect.x).to.be.above(0);
            (0, chai_1.expect)(rect.y).to.be.above(0);
            (0, chai_1.expect)(rect.width).to.be.above(0);
            (0, chai_1.expect)(rect.height).to.be.above(0);
            (0, chai_1.expect)(score).to.be.above(0);
        });
        it('should reject matches that fall below a threshold', async function () {
            await (0, chai_1.expect)((0, lib_1.getImageOccurrence)(fullImage, partialImage, {
                threshold: 1.0,
            })).to.eventually.be.rejectedWith(/threshold/);
        });
        it('should visualize the partial image position in the full image', async function () {
            const { visualization } = await (0, lib_1.getImageOccurrence)(fullImage, partialImage, {
                visualize: true,
            });
            (0, chai_1.expect)(visualization).to.not.be.empty;
        });
        describe('multiple', function () {
            it('should return matches in the full image', async function () {
                const { multiple } = await (0, lib_1.getImageOccurrence)(originalImage, numberImage, {
                    threshold: 0.8,
                    multiple: true,
                });
                (0, chai_1.expect)(multiple).to.have.length(3);
                for (const result of multiple) {
                    (0, chai_1.expect)(result.rect.x).to.be.above(0);
                    (0, chai_1.expect)(result.rect.y).to.be.above(0);
                    (0, chai_1.expect)(result.rect.width).to.be.above(0);
                    (0, chai_1.expect)(result.rect.height).to.be.above(0);
                    (0, chai_1.expect)(result.score).to.be.above(0);
                }
            });
            it('should reject matches that fall below a threshold', async function () {
                const { multiple } = await (0, lib_1.getImageOccurrence)(originalImage, numberImage, {
                    threshold: 1.0,
                    multiple: true,
                });
                (0, chai_1.expect)(multiple).to.have.length(1);
            });
            it('should visualize the partial image position in the full image', async function () {
                const { multiple } = await (0, lib_1.getImageOccurrence)(originalImage, numberImage, {
                    visualize: true,
                    multiple: true,
                });
                for (const result of multiple) {
                    (0, chai_1.expect)(result.visualization).to.not.be.empty;
                }
            });
        });
    });
});
//# sourceMappingURL=opencv.e2e.spec.js.map