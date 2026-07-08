"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const lib_1 = require("../../lib");
const node_path_1 = __importDefault(require("node:path"));
const promises_1 = require("node:fs/promises");
const sinon_1 = require("sinon");
const teen_process_1 = require("teen_process");
// TODO: normalize test organization
const MOCHA_TIMEOUT = 10000;
describe('fs', function () {
    this.timeout(MOCHA_TIMEOUT);
    const existingPath = __filename;
    let sandbox;
    before(function () {
        (0, chai_1.use)(chai_as_promised_1.default);
    });
    beforeEach(function () {
        sandbox = (0, sinon_1.createSandbox)();
    });
    afterEach(function () {
        sandbox.restore();
    });
    describe('mkdir()', function () {
        const dirName = node_path_1.default.resolve(__dirname, 'tmp');
        it('should make a directory that does not exist', async function () {
            await lib_1.fs.rimraf(dirName);
            await lib_1.fs.mkdir(dirName);
            const exists = await lib_1.fs.hasAccess(dirName);
            (0, chai_1.expect)(exists).to.be.true;
        });
        it('should not complain if the dir already exists', async function () {
            const exists = await lib_1.fs.hasAccess(dirName);
            (0, chai_1.expect)(exists).to.be.true;
            await lib_1.fs.mkdir(dirName);
        });
        it('should still throw an error if something else goes wrong', async function () {
            await (0, chai_1.expect)(lib_1.fs.mkdir('/bin/foo')).to.be.rejected;
        });
    });
    it('hasAccess()', async function () {
        (0, chai_1.expect)(await lib_1.fs.exists(existingPath)).to.be.ok;
        const nonExistingPath = node_path_1.default.resolve(__dirname, 'wrong-specs.js');
        (0, chai_1.expect)(await lib_1.fs.hasAccess(nonExistingPath)).to.not.be.ok;
    });
    it('exists()', async function () {
        (0, chai_1.expect)(await lib_1.fs.exists(existingPath)).to.be.ok;
        const nonExistingPath = node_path_1.default.resolve(__dirname, 'wrong-specs.js');
        (0, chai_1.expect)(await lib_1.fs.exists(nonExistingPath)).to.not.be.ok;
    });
    it('readFile()', async function () {
        (0, chai_1.expect)(await lib_1.fs.readFile(existingPath, 'utf8')).to.contain('readFile');
    });
    describe('copyFile()', function () {
        it('should be able to copy a file', async function () {
            const newPath = node_path_1.default.resolve(await lib_1.tempDir.openDir(), 'fs-specs.js');
            await lib_1.fs.copyFile(existingPath, newPath);
            (0, chai_1.expect)(await lib_1.fs.readFile(newPath, 'utf8')).to.contain('readFile');
        });
        it('should throw an error if the source does not exist', async function () {
            await (0, chai_1.expect)(lib_1.fs.copyFile('/sdfsdfsdfsdf', '/tmp/bla')).to.eventually.be.rejected;
        });
        it('should honor filter when copying a directory', async function () {
            const srcDir = node_path_1.default.resolve(await lib_1.tempDir.openDir(), 'copy-src');
            const destDir = node_path_1.default.resolve(await lib_1.tempDir.openDir(), 'copy-dest');
            await (0, promises_1.mkdir)(srcDir);
            await (0, promises_1.writeFile)(node_path_1.default.join(srcDir, 'keep.txt'), 'keep');
            await (0, promises_1.writeFile)(node_path_1.default.join(srcDir, 'skip.txt'), 'skip');
            await lib_1.fs.copyFile(srcDir, destDir, {
                filter: (filename) => !filename.endsWith('skip.txt'),
            });
            (0, chai_1.expect)(await lib_1.fs.exists(node_path_1.default.join(destDir, 'keep.txt'))).to.be.true;
            (0, chai_1.expect)(await lib_1.fs.exists(node_path_1.default.join(destDir, 'skip.txt'))).to.be.false;
        });
    });
    it('rimraf()', async function () {
        const newPath = node_path_1.default.resolve(await lib_1.tempDir.openDir(), 'fs-specs.js');
        await lib_1.fs.copyFile(existingPath, newPath);
        (0, chai_1.expect)(await lib_1.fs.exists(newPath)).to.be.true;
        await lib_1.fs.rimraf(newPath);
        (0, chai_1.expect)(await lib_1.fs.exists(newPath)).to.be.false;
    });
    it('sanitizeName()', function () {
        (0, chai_1.expect)(lib_1.fs.sanitizeName(':file?.txt', {
            replacement: '-',
        })).to.eql('-file-.txt');
    });
    it('rimrafSync()', async function () {
        const newPath = node_path_1.default.resolve(await lib_1.tempDir.openDir(), 'fs-specs.js');
        await lib_1.fs.copyFile(existingPath, newPath);
        (0, chai_1.expect)(await lib_1.fs.exists(newPath)).to.be.true;
        lib_1.fs.rimrafSync(newPath);
        (0, chai_1.expect)(await lib_1.fs.exists(newPath)).to.be.false;
    });
    describe('md5()', function () {
        this.timeout(1200000);
        let smallFilePath;
        let bigFilePath;
        before(async function () {
            // Get the path of a small file (this source file).
            smallFilePath = existingPath;
            // Create a large file to test, about 163840000 bytes.
            bigFilePath = node_path_1.default.resolve(await lib_1.tempDir.openDir(), 'enormous.txt');
            const file = await lib_1.fs.open(bigFilePath, 'w');
            let fileData = '';
            for (let i = 0; i < 4096; i++) {
                fileData += '1';
            }
            for (let i = 0; i < 40000; i++) {
                await lib_1.fs.write(file, fileData);
            }
            await lib_1.fs.close(file);
        });
        after(async function () {
            await lib_1.fs.unlink(bigFilePath);
        });
        it('should calculate hash of correct length', async function () {
            (0, chai_1.expect)(await lib_1.fs.md5(smallFilePath)).to.have.length(32);
        });
        it('should be able to run on huge file', async function () {
            (0, chai_1.expect)(await lib_1.fs.md5(bigFilePath)).to.have.length(32);
        });
    });
    describe('hash()', function () {
        it('should calculate sha1 hash', async function () {
            (0, chai_1.expect)(await lib_1.fs.hash(existingPath, 'sha1')).to.have.length(40);
        });
        it('should calculate md5 hash', async function () {
            (0, chai_1.expect)(await lib_1.fs.hash(existingPath, 'md5')).to.have.length(32);
        });
    });
    it('stat()', async function () {
        const stat = await lib_1.fs.stat(existingPath);
        (0, chai_1.expect)(stat).to.have.property('atime');
    });
    describe('which()', function () {
        before(function () {
            if (lib_1.system.isWindows()) {
                return this.skip();
            }
        });
        it('should find correct executable', async function () {
            const systemNpmPath = (await (0, teen_process_1.exec)('which', ['npm'])).stdout.trim();
            const npmPath = await lib_1.fs.which('npm');
            (0, chai_1.expect)(npmPath).to.equal(systemNpmPath);
        });
        it('should fail gracefully', async function () {
            await (0, chai_1.expect)(lib_1.fs.which('something_that_does_not_exist')).to.eventually.be.rejected;
        });
    });
    it('glob()', async function () {
        const glob = '*.spec.ts';
        const tests = await lib_1.fs.glob(glob, { cwd: __dirname });
        (0, chai_1.expect)(tests).to.be.an('array');
        (0, chai_1.expect)(tests.length).to.be.above(2);
    });
    describe('walkDir()', function () {
        it('walkDir recursive', async function () {
            await (0, chai_1.expect)(lib_1.fs.walkDir(__dirname, true, (item) => item.endsWith(`logger${node_path_1.default.sep}helpers.ts`))).to.eventually.not.be.null;
        });
        it('should walk all elements recursive', async function () {
            await (0, chai_1.expect)(lib_1.fs.walkDir(node_path_1.default.join(__dirname, '..', 'e2e', 'fixture'), true, () => undefined))
                .to.eventually.be.null;
        });
        it('should throw error through callback', async function () {
            const err = new Error('Callback error');
            const stub = sandbox.stub().rejects(err);
            await (0, chai_1.expect)(lib_1.fs.walkDir(__dirname, true, stub)).to.eventually.be.rejectedWith(err);
            (0, chai_1.expect)(stub.calledOnce).to.be.true;
        });
        it('should traverse non-recursively', async function () {
            const filePath = await lib_1.fs.walkDir(__dirname, false, (item) => item.endsWith('logger/helpers.js'));
            (0, chai_1.expect)(filePath).to.be.null;
        });
    });
    describe('findRoot()', function () {
        describe('when not provided an argument', function () {
            it('should throw', function () {
                (0, chai_1.expect)(() => lib_1.fs.findRoot()).to.throw(TypeError);
            });
        });
        describe('when provided a relative path', function () {
            it('should throw', function () {
                (0, chai_1.expect)(() => lib_1.fs.findRoot('./foo')).to.throw(TypeError);
            });
        });
        describe('when provided an empty string', function () {
            it('should throw', function () {
                (0, chai_1.expect)(() => lib_1.fs.findRoot('')).to.throw(TypeError);
            });
        });
        describe('when provided an absolute path', function () {
            describe('when the path has a parent `package.json`', function () {
                it('should locate the dir with the closest `package.json`', function () {
                    (0, chai_1.expect)(lib_1.fs.findRoot(__dirname)).to.be.a('string');
                });
            });
            describe('when the path does not have a parent `package.json`', function () {
                it('should throw', function () {
                    (0, chai_1.expect)(() => lib_1.fs.findRoot('/')).to.throw(Error);
                });
            });
        });
    });
    describe('readPackageJsonFrom()', function () {
        describe('when not provided an argument', function () {
            it('should throw', function () {
                (0, chai_1.expect)(() => lib_1.fs.readPackageJsonFrom()).to.throw(TypeError, /non-empty, absolute path/);
            });
        });
        describe('when provided a relative path', function () {
            it('should throw', function () {
                (0, chai_1.expect)(() => lib_1.fs.readPackageJsonFrom('./foo')).to.throw(TypeError);
            });
        });
        describe('when provided an empty string', function () {
            it('should throw', function () {
                (0, chai_1.expect)(() => lib_1.fs.readPackageJsonFrom('')).to.throw(TypeError);
            });
        });
        describe('when provided an absolute path', function () {
            describe('when the path does not have a parent `package.json`', function () {
                it('should throw', function () {
                    (0, chai_1.expect)(() => lib_1.fs.readPackageJsonFrom('/')).to.throw(Error);
                });
            });
            describe('when the path has a parent `package.json`', function () {
                it('should read the `package.json` found in the root dir', function () {
                    (0, chai_1.expect)(lib_1.fs.readPackageJsonFrom(__dirname)).to.be.an('object');
                });
            });
        });
    });
});
//# sourceMappingURL=fs.spec.js.map