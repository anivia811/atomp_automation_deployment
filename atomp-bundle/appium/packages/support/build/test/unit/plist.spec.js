"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const node_path_1 = __importDefault(require("node:path"));
const lib_1 = require("../../lib");
const binaryPlistPath = node_path_1.default.join(__dirname, 'assets', 'sample_binary.plist');
const textPlistPath = node_path_1.default.join(__dirname, 'assets', 'sample_text.plist');
describe('plist', function () {
    before(function () {
        (0, chai_1.use)(chai_as_promised_1.default);
    });
    it('should parse plist file as binary', async function () {
        const content = await lib_1.plist.parsePlistFile(binaryPlistPath);
        (0, chai_1.expect)(content).to.have.property('com.apple.locationd.bundle-/System/Library/PrivateFrameworks/Parsec.framework');
    });
    it(`should return an empty object if file doesn't exist and mustExist is set to false`, async function () {
        const mustExist = false;
        const content = await lib_1.plist.parsePlistFile('doesntExist.plist', mustExist);
        (0, chai_1.expect)(content).to.be.an('object');
        (0, chai_1.expect)(content).to.be.empty;
    });
    it('should write plist file as binary', async function () {
        const plistFile = node_path_1.default.resolve(await lib_1.tempDir.openDir(), 'sample.plist');
        await lib_1.fs.copyFile(binaryPlistPath, plistFile);
        const updatedFields = {
            'io.appium.test': true,
        };
        await lib_1.plist.updatePlistFile(plistFile, updatedFields, true);
        const content = await lib_1.plist.parsePlistFile(plistFile);
        (0, chai_1.expect)(content).to.have.property('io.appium.test');
    });
    it('should read binary plist', async function () {
        const content = await lib_1.fs.readFile(binaryPlistPath);
        const object = lib_1.plist.parsePlist(content);
        (0, chai_1.expect)(object).to.have.property('com.apple.locationd.bundle-/System/Library/PrivateFrameworks/Parsec.framework');
    });
    it('should read text plist', async function () {
        const content = await lib_1.fs.readFile(textPlistPath);
        const object = lib_1.plist.parsePlist(content);
        (0, chai_1.expect)(object).to.have.property('com.apple.locationd.bundle-/System/Library/PrivateFrameworks/Parsec.framework');
    });
    it('should read text plist from Uint8Array', async function () {
        const content = await lib_1.fs.readFile(textPlistPath);
        const object = lib_1.plist.parsePlist(new Uint8Array(content));
        (0, chai_1.expect)(object).to.have.property('com.apple.locationd.bundle-/System/Library/PrivateFrameworks/Parsec.framework');
    });
    it('should read binary plist from Uint8Array', async function () {
        const content = await lib_1.fs.readFile(binaryPlistPath);
        const object = lib_1.plist.parsePlist(new Uint8Array(content));
        (0, chai_1.expect)(object).to.have.property('com.apple.locationd.bundle-/System/Library/PrivateFrameworks/Parsec.framework');
    });
    it('should read binary plist from ArrayBuffer', async function () {
        const content = await lib_1.fs.readFile(binaryPlistPath);
        const object = lib_1.plist.parsePlist(content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength));
        (0, chai_1.expect)(object).to.have.property('com.apple.locationd.bundle-/System/Library/PrivateFrameworks/Parsec.framework');
    });
    it('should parse nested data payload returned from plist parser', function () {
        const innerPayload = lib_1.plist.createBinaryPlist({ answer: 42 });
        const outer = lib_1.plist.createPlist({ payload: innerPayload });
        const outerParsed = lib_1.plist.parsePlist(outer);
        const nestedPayload = outerParsed.payload;
        const nestedParsed = lib_1.plist.parsePlist(nestedPayload);
        (0, chai_1.expect)(nestedParsed).to.deep.equal({ answer: 42 });
    });
});
//# sourceMappingURL=plist.spec.js.map