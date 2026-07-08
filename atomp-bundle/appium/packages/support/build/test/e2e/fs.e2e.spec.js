"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const fs_1 = require("../../lib/fs");
const tempdir_1 = require("../../lib/tempdir");
const system_1 = require("../../lib/system");
describe('fs', function () {
    before(async function () {
        (0, chai_1.use)(chai_as_promised_1.default);
    });
    describe('mv()', function () {
        let srcRoot;
        let dstRoot;
        beforeEach(async function () {
            srcRoot = await (0, tempdir_1.openDir)();
            dstRoot = await (0, tempdir_1.openDir)();
        });
        afterEach(async function () {
            await Promise.all([srcRoot, dstRoot].filter((p) => p != null).map((p) => fs_1.fs.rimraf(p)));
            srcRoot = dstRoot = undefined;
        });
        it('should move file', async function () {
            const srcPath = node_path_1.default.join(srcRoot, 'src.file');
            await fs_1.fs.writeFile(srcPath, Buffer.from('bar'));
            const dstPath = node_path_1.default.join(dstRoot, node_path_1.default.basename(srcPath));
            await fs_1.fs.mv(srcPath, dstPath);
            (0, chai_1.expect)(await fs_1.fs.exists(node_path_1.default.join(dstRoot, node_path_1.default.basename(srcPath)))).to.be.true;
            (0, chai_1.expect)(await fs_1.fs.exists(node_path_1.default.join(srcRoot, node_path_1.default.basename(srcPath)))).to.be.false;
        });
        it('should move folder', async function () {
            const srcPath = node_path_1.default.join(srcRoot, 'foo', 'src.file');
            await fs_1.fs.mkdirp(node_path_1.default.dirname(srcPath));
            await fs_1.fs.writeFile(srcPath, Buffer.from('bar'));
            await fs_1.fs.mv(srcRoot, dstRoot, { mkdirp: true });
            (0, chai_1.expect)(await fs_1.fs.exists(node_path_1.default.join(dstRoot, node_path_1.default.basename(node_path_1.default.dirname(srcPath))))).to.be.true;
            (0, chai_1.expect)(await fs_1.fs.exists(node_path_1.default.join(dstRoot, node_path_1.default.basename(node_path_1.default.dirname(srcPath)), node_path_1.default.basename(srcPath)))).to.be.true;
            (0, chai_1.expect)(await fs_1.fs.exists(node_path_1.default.join(srcRoot, node_path_1.default.basename(node_path_1.default.dirname(srcPath))))).to.be
                .false;
        });
        it('should fail if source path does not exist', async function () {
            const srcPath = node_path_1.default.join(srcRoot, 'src.file');
            const dstPath = node_path_1.default.join(dstRoot, node_path_1.default.basename(srcPath));
            await (0, chai_1.expect)(fs_1.fs.mv(srcPath, dstPath)).to.eventually.be.rejected;
        });
        it('should fail if destination path already exists and clobber is disabled', async function () {
            const srcPath = node_path_1.default.join(srcRoot, 'src.file');
            await fs_1.fs.writeFile(srcPath, Buffer.from('bar'));
            const dstPath = node_path_1.default.join(dstRoot, node_path_1.default.basename(srcPath));
            await fs_1.fs.writeFile(dstPath, Buffer.from('foo'));
            await (0, chai_1.expect)(fs_1.fs.mv(srcPath, dstPath, { clobber: false })).to.eventually.be.rejected;
            (0, chai_1.expect)((await fs_1.fs.readFile(dstPath)).toString()).to.eql('foo');
        });
        it('should override a file if already exists by default', async function () {
            const srcPath = node_path_1.default.join(srcRoot, 'src.file');
            await fs_1.fs.writeFile(srcPath, Buffer.from('bar'));
            const dstPath = node_path_1.default.join(dstRoot, node_path_1.default.basename(srcPath));
            await fs_1.fs.writeFile(dstPath, Buffer.from('foo'));
            await fs_1.fs.mv(srcPath, dstPath);
            (0, chai_1.expect)((await fs_1.fs.readFile(dstPath)).toString()).to.eql('bar');
        });
        it('should handle cross-device move by falling back to copy-and-delete', async function () {
            const srcPath = node_path_1.default.join(srcRoot, 'src.file');
            await fs_1.fs.writeFile(srcPath, Buffer.from('bar'));
            const dstPath = node_path_1.default.join(dstRoot, node_path_1.default.basename(srcPath));
            // Mock fs.rename to simulate EXDEV (cross-device) error so mv falls back to copy-and-delete.
            const originalRename = fs_1.fs.rename;
            fs_1.fs.rename = async () => {
                const err = new Error('cross-device link not permitted');
                err.code = 'EXDEV';
                throw err;
            };
            try {
                await fs_1.fs.mv(srcPath, dstPath);
                (0, chai_1.expect)(await fs_1.fs.exists(dstPath)).to.be.true;
                (0, chai_1.expect)(await fs_1.fs.exists(srcPath)).to.be.false;
                (0, chai_1.expect)((await fs_1.fs.readFile(dstPath)).toString()).to.eql('bar');
            }
            finally {
                // Restore original function.
                fs_1.fs.rename = originalRename;
            }
        });
    });
    describe('isExecutable()', function () {
        describe('when the path does not exist', function () {
            it('should return `false`', async function () {
                await (0, chai_1.expect)(fs_1.fs.isExecutable('/path/to/nowhere')).to.eventually.be.false;
            });
        });
        describe('when the path exists', function () {
            beforeEach(function () {
                if ((0, system_1.isWindows)()) {
                    return this.skip();
                }
            });
            describe('when the path is not executable', function () {
                it('should return `false`', async function () {
                    await (0, chai_1.expect)(fs_1.fs.isExecutable(__filename)).to.eventually.be.false;
                });
            });
            describe('when the path is executable', function () {
                it('should return `true`', async function () {
                    await (0, chai_1.expect)(fs_1.fs.isExecutable('/bin/bash')).to.eventually.be.true;
                });
            });
        });
        describe('when the parameter is not a path', function () {
            it('should return `false`', async function () {
                await (0, chai_1.expect)(fs_1.fs.isExecutable(undefined)).to.eventually.be.false;
            });
        });
    });
});
//# sourceMappingURL=fs.e2e.spec.js.map