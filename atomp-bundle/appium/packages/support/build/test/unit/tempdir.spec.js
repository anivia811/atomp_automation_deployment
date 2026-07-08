"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const lib_1 = require("../../lib");
describe('tempdir', function () {
    before(function () {
        (0, chai_1.use)(chai_as_promised_1.default);
    });
    afterEach(function () {
        delete process.env.APPIUM_TMP_DIR;
    });
    it('should be able to generate a path', async function () {
        const path = await lib_1.tempDir.path({ prefix: 'myfile', suffix: '.tmp' });
        (0, chai_1.expect)(path).to.exist;
        (0, chai_1.expect)(path).to.include('myfile.tmp');
    });
    it('should be able to generate a path with process.env.APPIUM_TMP_DIR', async function () {
        const preRootDirPath = await lib_1.tempDir.openDir();
        process.env.APPIUM_TMP_DIR = preRootDirPath;
        const path = await lib_1.tempDir.path({ prefix: 'myfile', suffix: '.tmp' });
        (0, chai_1.expect)(path).to.exist;
        (0, chai_1.expect)(path).to.include(preRootDirPath);
        (0, chai_1.expect)(path).to.include('myfile.tmp');
    });
    it('should be able to create a temp file', async function () {
        const res = await lib_1.tempDir.open({ prefix: 'my-test-file', suffix: '.zip' });
        (0, chai_1.expect)(res).to.exist;
        (0, chai_1.expect)(res.path).to.exist;
        (0, chai_1.expect)(res.path).to.include('my-test-file.zip');
        (0, chai_1.expect)(res.fd).to.exist;
        await (0, chai_1.expect)(lib_1.fs.exists(res.path)).to.eventually.be.ok;
    });
    it('should be able to create a temp file with process.env.APPIUM_TMP_DIR', async function () {
        const preRootDirPath = await lib_1.tempDir.openDir();
        process.env.APPIUM_TMP_DIR = preRootDirPath;
        const res = await lib_1.tempDir.open({ prefix: 'my-test-file', suffix: '.zip' });
        (0, chai_1.expect)(res).to.exist;
        (0, chai_1.expect)(res.path).to.exist;
        (0, chai_1.expect)(res.path).to.include(preRootDirPath);
        (0, chai_1.expect)(res.path).to.include('my-test-file.zip');
        (0, chai_1.expect)(res.fd).to.exist;
        await (0, chai_1.expect)(lib_1.fs.exists(res.path)).to.eventually.be.ok;
    });
    it('should generate a random temp dir', async function () {
        const res = await lib_1.tempDir.openDir();
        (0, chai_1.expect)(res).to.be.a('string');
        await (0, chai_1.expect)(lib_1.fs.exists(res)).to.eventually.be.ok;
        const res2 = await lib_1.tempDir.openDir();
        await (0, chai_1.expect)(lib_1.fs.exists(res2)).to.eventually.be.ok;
        (0, chai_1.expect)(res).to.not.equal(res2);
    });
    it('should generate a random temp dir, but the same with process.env.APPIUM_TMP_DIR', async function () {
        const preRootDirPath = await lib_1.tempDir.openDir();
        process.env.APPIUM_TMP_DIR = preRootDirPath;
        const res = await lib_1.tempDir.openDir();
        (0, chai_1.expect)(res).to.be.a('string');
        await (0, chai_1.expect)(lib_1.fs.exists(res)).to.eventually.be.ok;
        const res2 = await lib_1.tempDir.openDir();
        await (0, chai_1.expect)(lib_1.fs.exists(res2)).to.eventually.be.ok;
        (0, chai_1.expect)(res).to.include(preRootDirPath);
        (0, chai_1.expect)(res2).to.include(preRootDirPath);
        (0, chai_1.expect)(res).to.not.equal(res2);
    });
    it('should generate one temp dir used for the life of the process', async function () {
        const res = await lib_1.tempDir.staticDir();
        (0, chai_1.expect)(res).to.be.a('string');
        await (0, chai_1.expect)(lib_1.fs.exists(res)).to.eventually.be.ok;
        const res2 = await lib_1.tempDir.staticDir();
        await (0, chai_1.expect)(lib_1.fs.exists(res2)).to.eventually.be.ok;
        (0, chai_1.expect)(res).to.equal(res2);
    });
});
//# sourceMappingURL=tempdir.spec.js.map