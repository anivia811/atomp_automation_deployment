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
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const zip = __importStar(require("../../lib/zip"));
const index_1 = require("../../lib/index");
const helpers_1 = require("../helpers");
const system_1 = require("../../lib/system");
describe('#zip', function () {
    const optionMap = new Map([
        ['native JS unzip', {}],
        ['system unzip', { useSystemUnzip: true }],
    ]);
    before(async function () {
        (0, chai_1.use)(chai_as_promised_1.default);
    });
    optionMap.forEach((options, desc) => {
        describe(desc, function () {
            let assetsPath;
            let zippedFilePath;
            let tmpRoot;
            beforeEach(async function () {
                assetsPath = await index_1.tempDir.openDir();
                tmpRoot = await index_1.tempDir.openDir();
                const zippedBase64 = 'UEsDBAoAAAAAALlzk0oAAAAAAAAAAAAAAAAJABAAdW56aXBwZWQvVVgMANBO+VjO1vdY9QEUAFBLAwQKAAAAAADAc5NKAAAAAAAAAAAAAAAAEgAQAHVuemlwcGVkL3Rlc3QtZGlyL1VYDADQTvlY19b3WPUBFABQSwMEFAAIAAgAwnOTSgAAAAAAAAAAAAAAABcAEAB1bnppcHBlZC90ZXN0LWRpci9hLnR4dFVYDACDTvlY3Nb3WPUBFADzSM3JyVcIzy/KSQEAUEsHCFaxF0oNAAAACwAAAFBLAwQUAAgACADEc5NKAAAAAAAAAAAAAAAAFwAQAHVuemlwcGVkL3Rlc3QtZGlyL2IudHh0VVgMAINO+Vjf1vdY9QEUAHPLz1dwSiwCAFBLBwhIfrZJCQAAAAcAAABQSwECFQMKAAAAAAC5c5NKAAAAAAAAAAAAAAAACQAMAAAAAAAAAABA7UEAAAAAdW56aXBwZWQvVVgIANBO+VjO1vdYUEsBAhUDCgAAAAAAwHOTSgAAAAAAAAAAAAAAABIADAAAAAAAAAAAQO1BNwAAAHVuemlwcGVkL3Rlc3QtZGlyL1VYCADQTvlY19b3WFBLAQIVAxQACAAIAMJzk0pWsRdKDQAAAAsAAAAXAAwAAAAAAAAAAECkgXcAAAB1bnppcHBlZC90ZXN0LWRpci9hLnR4dFVYCACDTvlY3Nb3WFBLAQIVAxQACAAIAMRzk0pIfrZJCQAAAAcAAAAXAAwAAAAAAAAAAECkgdkAAAB1bnppcHBlZC90ZXN0LWRpci9iLnR4dFVYCACDTvlY39b3WFBLBQYAAAAABAAEADEBAAA3AQAAAAA=';
                zippedFilePath = node_path_1.default.resolve(tmpRoot, 'zipped.zip');
                await index_1.fs.writeFile(zippedFilePath, zippedBase64, 'base64');
                await zip.extractAllTo(zippedFilePath, assetsPath, options);
            });
            afterEach(async function () {
                for (const tmpPath of [assetsPath, tmpRoot]) {
                    if (!(await index_1.fs.exists(tmpPath))) {
                        continue;
                    }
                    try {
                        await index_1.fs.rimraf(tmpPath);
                    }
                    catch {
                        // on windows, this can break due to file handles being open on files within the directory.
                    }
                }
            });
            describe('extractAllTo()', function () {
                it('should extract contents of a .zip file to a directory', async function () {
                    await (0, chai_1.expect)(index_1.fs.readFile(node_path_1.default.resolve(assetsPath, 'unzipped', 'test-dir', 'a.txt'), {
                        encoding: 'utf8',
                    })).to.eventually.equal('Hello World');
                    await (0, chai_1.expect)(index_1.fs.readFile(node_path_1.default.resolve(assetsPath, 'unzipped', 'test-dir', 'b.txt'), {
                        encoding: 'utf8',
                    })).to.eventually.equal('Foo Bar');
                });
            });
            describe('assertValidZip', function () {
                it('should not throw an error if a valid ZIP file is passed', async function () {
                    await (0, chai_1.expect)(zip.assertValidZip(zippedFilePath)).to.eventually.be.fulfilled;
                });
                it('should throw an error if the file does not exist', async function () {
                    await (0, chai_1.expect)(zip.assertValidZip('blabla')).to.eventually.be.rejected;
                });
                it('should throw an error if the file is invalid', async function () {
                    await (0, chai_1.expect)(zip.assertValidZip(node_path_1.default.resolve(assetsPath, 'unzipped', 'test-dir', 'a.txt'))).to.eventually.be.rejected;
                });
            });
            describe('readEntries()', function () {
                const expectedEntries = [
                    { name: 'unzipped/' },
                    { name: 'unzipped/test-dir/' },
                    { name: 'unzipped/test-dir/a.txt', contents: 'Hello World' },
                    { name: 'unzipped/test-dir/b.txt', contents: 'Foo Bar' },
                ];
                it('should iterate entries (directories and files) of zip file', async function () {
                    let i = 0;
                    await zip.readEntries(zippedFilePath, async ({ entry, extractEntryTo }) => {
                        (0, chai_1.expect)(entry.fileName).to.equal(expectedEntries[i].name);
                        // If it's a file, test that we can extract it to a temporary directory and that the contents are correct.
                        if (expectedEntries[i].contents) {
                            await extractEntryTo(tmpRoot);
                            await (0, chai_1.expect)(index_1.fs.readFile(node_path_1.default.resolve(tmpRoot, entry.fileName), {
                                flag: 'r',
                                encoding: 'utf8',
                            })).to.eventually.equal(expectedEntries[i].contents);
                        }
                        i++;
                    });
                });
                it('should stop iterating zipFile if onEntry callback returns false', async function () {
                    let i = 0;
                    await zip.readEntries(zippedFilePath, async () => {
                        i++;
                        return false;
                    });
                    (0, chai_1.expect)(i).to.equal(1);
                });
                it('should be rejected if it uses a non-zip file', async function () {
                    const promise = zip.readEntries(node_path_1.default.resolve(assetsPath, 'unzipped', 'test-dir', 'a.txt'), async () => { });
                    await (0, chai_1.expect)(promise).to.eventually.be.rejected;
                });
            });
            describe('toInMemoryZip()', function () {
                it('should convert a local file to an in-memory zip buffer', async function () {
                    // Convert directory to in-memory buffer.
                    const testFolder = node_path_1.default.resolve(assetsPath, 'unzipped');
                    const buffer = await zip.toInMemoryZip(testFolder);
                    (0, chai_1.expect)(Buffer.isBuffer(buffer)).to.be.true;
                    // Write the buffer to a zip file.
                    await index_1.fs.writeFile(node_path_1.default.resolve(tmpRoot, 'test.zip'), buffer);
                    // Unzip the file and test that it has the same contents as the directory that was zipped.
                    await zip.extractAllTo(node_path_1.default.resolve(tmpRoot, 'test.zip'), node_path_1.default.resolve(tmpRoot, 'output'), {
                        fileNamesEncoding: 'utf8',
                    });
                    await (0, chai_1.expect)(index_1.fs.readFile(node_path_1.default.resolve(tmpRoot, 'output', 'test-dir', 'a.txt'), {
                        encoding: 'utf8',
                    })).to.eventually.equal('Hello World');
                    await (0, chai_1.expect)(index_1.fs.readFile(node_path_1.default.resolve(tmpRoot, 'output', 'test-dir', 'b.txt'), {
                        encoding: 'utf8',
                    })).to.eventually.equal('Foo Bar');
                });
                it('should convert a local folder to an in-memory base64-encoded zip buffer', async function () {
                    const testFolder = node_path_1.default.resolve(assetsPath, 'unzipped');
                    const buffer = await zip.toInMemoryZip(testFolder, {
                        encodeToBase64: true,
                    });
                    await index_1.fs.writeFile(node_path_1.default.resolve(tmpRoot, 'test.zip'), Buffer.from(buffer.toString(), 'base64'));
                    // Unzip the file and test that it has the same contents as the directory that was zipped.
                    await zip.extractAllTo(node_path_1.default.resolve(tmpRoot, 'test.zip'), node_path_1.default.resolve(tmpRoot, 'output'));
                    await (0, chai_1.expect)(index_1.fs.readFile(node_path_1.default.resolve(tmpRoot, 'output', 'test-dir', 'a.txt'), {
                        encoding: 'utf8',
                    })).to.eventually.equal('Hello World');
                    await (0, chai_1.expect)(index_1.fs.readFile(node_path_1.default.resolve(tmpRoot, 'output', 'test-dir', 'b.txt'), {
                        encoding: 'utf8',
                    })).to.eventually.equal('Foo Bar');
                });
                it('should be rejected if use a bad path', async function () {
                    await (0, chai_1.expect)(zip.toInMemoryZip(node_path_1.default.resolve(assetsPath, 'bad_path'))).to.be.rejectedWith(/no such/i);
                });
                it('should be rejected if max size is exceeded', async function () {
                    const testFolder = node_path_1.default.resolve(assetsPath, 'unzipped');
                    await (0, chai_1.expect)(zip.toInMemoryZip(testFolder, {
                        maxSize: 1,
                    })).to.be.rejectedWith(/must not be greater/);
                });
            });
            describe('_extractEntryTo()', function () {
                let entry;
                let destDir;
                let mockZipFile;
                let mockZipStream;
                beforeEach(async function () {
                    destDir = await index_1.tempDir.openDir();
                    mockZipStream = new helpers_1.MockReadWriteStream();
                    mockZipFile = {
                        // yauzl API is callback-based; we're mocking it.
                        /* eslint-disable promise/prefer-await-to-callbacks */
                        openReadStream: (e, cb) => cb(null, mockZipStream),
                        /* eslint-enable promise/prefer-await-to-callbacks */
                    };
                });
                it('should be rejected if entry path is outside of destDir', async function () {
                    entry = {
                        fileName: node_path_1.default.resolve(destDir, '..', 'temp', 'file'),
                    };
                    await (0, chai_1.expect)(zip._extractEntryTo(mockZipFile, entry, destDir)).to.be.rejectedWith('Out of bound path');
                });
                it('should be rejected if zip stream emits an error', async function () {
                    entry = {
                        fileName: node_path_1.default.resolve(destDir, 'temp', 'file'),
                    };
                    mockZipStream.pipe = () => {
                        mockZipStream.emit('error', new Error('zip stream error'));
                    };
                    await (0, chai_1.expect)(zip._extractEntryTo(mockZipFile, entry, destDir)).to.be.rejectedWith('zip stream error');
                });
                it('should be rejected if write stream emits an error', async function () {
                    entry = {
                        fileName: node_path_1.default.resolve(destDir, 'temp', 'file'),
                    };
                    mockZipStream.pipe = (dest) => {
                        const writeStream = dest;
                        writeStream.emit('error', new Error('write stream error'));
                        mockZipStream.end();
                        writeStream.end();
                    };
                    await (0, chai_1.expect)(zip._extractEntryTo(mockZipFile, entry, destDir)).to.be.rejectedWith('write stream error');
                });
            });
            describe('toArchive', function () {
                it('should zip all files into an archive', async function () {
                    const testFolder = node_path_1.default.resolve(assetsPath, 'unzipped');
                    const dstPath = node_path_1.default.resolve(tmpRoot, 'test.zip');
                    await zip.toArchive(dstPath, {
                        cwd: testFolder,
                    });
                    // Unzip the file and test that it has the same contents as the directory that was zipped.
                    await zip.extractAllTo(dstPath, node_path_1.default.resolve(tmpRoot, 'output'));
                    await (0, chai_1.expect)(index_1.fs.readFile(node_path_1.default.resolve(tmpRoot, 'output', 'test-dir', 'a.txt'), {
                        encoding: 'utf8',
                    })).to.eventually.equal('Hello World');
                    await (0, chai_1.expect)(index_1.fs.readFile(node_path_1.default.resolve(tmpRoot, 'output', 'test-dir', 'b.txt'), {
                        encoding: 'utf8',
                    })).to.eventually.equal('Foo Bar');
                });
            });
        });
    });
    describe('unicode filename handling', function () {
        let zippedFilePath;
        let assetsPath;
        let tmpRoot;
        beforeEach(async function () {
            // XXX: I don't know enough about unicode handling in the windows FS to attempt a fix here.
            if ((0, system_1.isWindows)()) {
                return this.skip();
            }
            assetsPath = await index_1.tempDir.openDir();
            tmpRoot = await index_1.tempDir.openDir();
            const zippedBase64 = 'UEsDBBQACAAIABF8/EYAAAAAAAAAABoAAAATACAAa2Fuamkt5q2j5LiW5LiVLmFwcFVUDQAHAgO4VVpX+GBZV/hgdXgLAAEE9QEAAAQUAAAAK8nILFYAorz8EoWi1MScnEqFxDyFxIICLgBQSwcIR93jPhoAAAAaAAAAUEsBAhQDFAAIAAgAEXz8Rkfd4z4aAAAAGgAAABMAIAAAAAAAAAAAAKSBAAAAAGthbmppLeato+S4luS4lS5hcHBVVA0ABwIDuFVaV/hgWVf4YHV4CwABBPUBAAAEFAAAAFBLBQYAAAAAAQABAGEAAAB7AAAAAAA=';
            zippedFilePath = node_path_1.default.resolve(tmpRoot, 'zipped.zip');
            await index_1.fs.writeFile(zippedFilePath, zippedBase64, 'base64');
            await zip.extractAllTo(zippedFilePath, assetsPath, {
                useSystemUnzip: true,
            });
        });
        afterEach(async function () {
            for (const tmpPath of [assetsPath, tmpRoot]) {
                if (!(await index_1.fs.exists(tmpPath))) {
                    continue;
                }
                await index_1.fs.rimraf(tmpPath);
            }
        });
        it('should retain the proper filenames', async function () {
            const expectedPath = node_path_1.default.join(assetsPath, 'kanji-正世丕.app');
            // fs.exists returns a boolean; throw with a clear message if the path is missing.
            if (!(await index_1.fs.exists(expectedPath))) {
                throw new Error(`Expected ${expectedPath} to exist, but it does not`);
            }
        });
    });
});
//# sourceMappingURL=zip.e2e.spec.js.map