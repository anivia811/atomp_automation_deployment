"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const storage_1 = require("../../lib/storage");
const support_1 = require("@appium/support");
const node_path_1 = __importDefault(require("node:path"));
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
(0, chai_1.use)(chai_as_promised_1.default);
const log = support_1.logger.getLogger();
describe('storage', function () {
    let tmpRoot;
    let storage;
    let storageRoot;
    before(async function () {
        tmpRoot = await support_1.tempDir.openDir();
    });
    after(async function () {
        if (tmpRoot && (await support_1.fs.exists(tmpRoot))) {
            await support_1.fs.rimraf(tmpRoot);
        }
    });
    beforeEach(async function () {
        storageRoot = await support_1.tempDir.openDir();
    });
    afterEach(async function () {
        if (storage) {
            await storage.reset();
            storage = null;
        }
        if (storageRoot && (await support_1.fs.exists(storageRoot))) {
            await support_1.fs.rimraf(storageRoot);
            storageRoot = undefined;
        }
    });
    it('should be initially empty', async function () {
        storage = new storage_1.Storage(storageRoot, false, false, log);
        const files = await storage.list();
        (0, chai_1.expect)(files).to.be.empty;
        (0, chai_1.expect)(await storage.delete('foo')).to.be.false;
    });
    it('should reset all files if shouldPreserveFiles is not requested', async function () {
        const name = 'foo.bar';
        const tmpName = 'bar.baz.filepart';
        await support_1.fs.writeFile(node_path_1.default.join(storageRoot, name), Buffer.alloc(1));
        await support_1.fs.writeFile(node_path_1.default.join(storageRoot, tmpName), Buffer.alloc(1));
        storage = new storage_1.Storage(storageRoot, true, false, log);
        const files = await storage.list();
        (0, chai_1.expect)(files.length).to.eql(1);
        await storage.reset();
        (0, chai_1.expect)(await support_1.fs.exists(node_path_1.default.join(storageRoot, name))).to.be.false;
        (0, chai_1.expect)(await support_1.fs.exists(node_path_1.default.join(storageRoot, tmpName))).to.be.false;
    });
    it('should only reset partial files if shouldPreserveFiles requested', async function () {
        const name = 'foo.bar';
        const tmpName = 'bar.baz.filepart';
        await support_1.fs.writeFile(node_path_1.default.join(storageRoot, name), Buffer.alloc(1));
        await support_1.fs.writeFile(node_path_1.default.join(storageRoot, tmpName), Buffer.alloc(1));
        storage = new storage_1.Storage(storageRoot, true, true, log);
        let files = await storage.list();
        (0, chai_1.expect)(files.length).to.eql(1);
        await storage.reset();
        files = await storage.list();
        (0, chai_1.expect)(files.length).to.eql(1);
        (0, chai_1.expect)(await support_1.fs.exists(node_path_1.default.join(storageRoot, tmpName))).to.be.false;
    });
    it('should perform basic operations', async function () {
        storage = new storage_1.Storage(storageRoot, false, false, log);
        const name = 'foo.bar';
        const size = 1 * 1024 * 1024;
        await addFileToStorage(name, size);
        let files = await storage.list();
        (0, chai_1.expect)(files).not.to.be.empty;
        (0, chai_1.expect)(files[0].name).to.eql(name);
        (0, chai_1.expect)(files[0].size).to.eql(size);
        (0, chai_1.expect)(files[0].path).to.eql(node_path_1.default.join(storageRoot, name));
        (0, chai_1.expect)(await storage.delete(name)).to.be.true;
        files = await storage.list();
        (0, chai_1.expect)(files).to.be.empty;
    });
    it('should be reset and preserve the root', async function () {
        storage = new storage_1.Storage(storageRoot, true, false, log);
        const name = 'foo.bar';
        const size = 1 * 1024 * 1024;
        await addFileToStorage(name, size);
        await storage.reset();
        const files = await storage.list();
        (0, chai_1.expect)(files).to.be.empty;
        (0, chai_1.expect)(await support_1.fs.exists(storageRoot)).to.be.true;
    });
    it('should be reset and preserve items', async function () {
        storage = new storage_1.Storage(storageRoot, false, true, log);
        const name = 'foo.bar';
        const size = 1 * 1024 * 1024;
        await addFileToStorage(name, size);
        await storage.reset();
        const files = await storage.list();
        (0, chai_1.expect)(files).not.to.be.empty;
        (0, chai_1.expect)(await support_1.fs.exists(storageRoot)).to.be.true;
    });
    describe('validateStorageItemName', function () {
        it('should accept valid file names', function () {
            (0, chai_1.expect)(() => (0, storage_1.validateStorageItemName)('foo.bar')).not.to.throw();
            (0, chai_1.expect)(() => (0, storage_1.validateStorageItemName)('foo-bar_baz')).not.to.throw();
        });
        it('should reject names that must be sanitized', function () {
            (0, chai_1.expect)(() => (0, storage_1.validateStorageItemName)('foo/bar')).to.throw(storage_1.StorageArgumentError, "The provided name value 'foo/bar' must be a valid file name. Did you mean 'foo_bar'?");
        });
        it('should reject empty file names', function () {
            (0, chai_1.expect)(() => (0, storage_1.validateStorageItemName)('')).to.throw(storage_1.StorageArgumentError, "The provided file name '' must not be empty");
        });
    });
    async function addFileToStorage(name, size) {
        const dummyPath = node_path_1.default.join(tmpRoot, name);
        await support_1.fs.writeFile(dummyPath, Buffer.alloc(size));
        const sha1 = await support_1.fs.hash(dummyPath);
        await storage.add({ name, sha1 }, support_1.fs.createReadStream(dummyPath));
        return dummyPath;
    }
});
//# sourceMappingURL=storage.spec.js.map