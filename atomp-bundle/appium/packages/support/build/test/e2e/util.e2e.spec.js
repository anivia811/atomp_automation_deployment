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
const asyncbox_1 = require("asyncbox");
const node_path_1 = __importDefault(require("node:path"));
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const util = __importStar(require("../../lib/util"));
const index_1 = require("../../lib/index");
describe('#util', function () {
    let tmpRoot = null;
    let tmpFile;
    const content = 'YOLO';
    before(async function () {
        (0, chai_1.use)(chai_as_promised_1.default);
    });
    beforeEach(async function () {
        tmpRoot = await index_1.tempDir.openDir();
        tmpFile = node_path_1.default.resolve(tmpRoot, 'example.txt');
        await index_1.fs.writeFile(tmpFile, content, 'utf8');
    });
    afterEach(async function () {
        if (tmpRoot) {
            await index_1.fs.rimraf(tmpRoot);
        }
        tmpRoot = null;
    });
    describe('toInMemoryBase64()', function () {
        it('should convert a file to base64 encoding', async function () {
            const data = await util.toInMemoryBase64(tmpFile);
            const fileContent = await index_1.fs.readFile(tmpFile);
            (0, chai_1.expect)(data.toString()).to.eql(fileContent.toString('base64'));
        });
    });
    describe('getLockFileGuard()', function () {
        let lockFile;
        let testFile;
        let guardTmpRoot;
        async function guardedBehavior(text, msBeforeActing) {
            await (0, asyncbox_1.sleep)(msBeforeActing);
            await index_1.fs.appendFile(testFile, text, 'utf8');
            return text;
        }
        async function testFileContents() {
            return (await index_1.fs.readFile(testFile)).toString('utf8');
        }
        beforeEach(async function () {
            guardTmpRoot = await index_1.tempDir.openDir();
            lockFile = node_path_1.default.resolve(guardTmpRoot, 'test.lock');
            testFile = node_path_1.default.resolve(guardTmpRoot, 'test');
            await index_1.fs.writeFile(testFile, 'a', 'utf8');
        });
        afterEach(async function () {
            try {
                await Promise.all([lockFile, testFile].map((p) => index_1.fs.unlink(p)));
            }
            catch {
                // ignore
            }
        });
        it('should lock a file during the given behavior', async function () {
            const guard = util.getLockFileGuard(lockFile);
            await (0, chai_1.expect)(guard.check()).to.eventually.be.false;
            const guardPromise = guard(async () => await guardedBehavior('b', 500));
            await (0, asyncbox_1.sleep)(200);
            await (0, chai_1.expect)(guard.check()).to.eventually.be.true;
            await guardPromise;
            await (0, chai_1.expect)(guard.check()).to.eventually.be.false;
            await (0, chai_1.expect)(testFileContents()).to.eventually.eql('ab');
        });
        it('should recover a broken lock file', async function () {
            await index_1.fs.writeFile(lockFile, 'dummy', 'utf8');
            const guard = util.getLockFileGuard(lockFile, {
                timeout: 3,
                tryRecovery: true,
            });
            await guard(async () => await guardedBehavior('b', 500));
            await (0, chai_1.expect)(guard.check()).to.eventually.be.false;
            await (0, chai_1.expect)(testFileContents()).to.eventually.eql('ab');
        });
        it('should block other behavior until the lock is released', async function () {
            // First prove that without a lock, we get races.
            await (0, chai_1.expect)(testFileContents()).to.eventually.eql('a');
            const unguardedPromise1 = guardedBehavior('b', 500);
            const unguardedPromise2 = guardedBehavior('c', 100);
            await unguardedPromise1;
            await unguardedPromise2;
            await (0, chai_1.expect)(testFileContents()).to.eventually.eql('acb');
            // Now prove that with a lock, we don't get any interlopers.
            const guard = util.getLockFileGuard(lockFile);
            const guardPromise1 = guard(async () => await guardedBehavior('b', 500));
            const guardPromise2 = guard(async () => await guardedBehavior('c', 100));
            await guardPromise1;
            await guardPromise2;
            await (0, chai_1.expect)(testFileContents()).to.eventually.eql('acbbc');
        });
        it('should return the result of the guarded behavior', async function () {
            const guard = util.getLockFileGuard(lockFile);
            const guardPromise1 = guard(async () => await guardedBehavior('hello', 500));
            const guardPromise2 = guard(async () => await guardedBehavior('world', 100));
            const ret1 = await guardPromise1;
            const ret2 = await guardPromise2;
            (0, chai_1.expect)(ret1).to.eql('hello');
            (0, chai_1.expect)(ret2).to.eql('world');
        });
        it('should time out if the lock is not released', async function () {
            this.timeout(5000);
            const guard = util.getLockFileGuard(lockFile, { timeout: 0.5 });
            const p1 = guard(async () => await guardedBehavior('hello', 1200));
            const p2 = guard(async () => await guardedBehavior('world', 10));
            await (0, chai_1.expect)(p2).to.eventually.be.rejectedWith(/not acquire lock/);
            await (0, chai_1.expect)(p1).to.eventually.eql('hello');
        });
        it('should still release lock if guarded behavior fails', async function () {
            this.timeout(5000);
            const guard = util.getLockFileGuard(lockFile);
            const p1 = guard(async () => {
                await (0, asyncbox_1.sleep)(500);
                throw new Error('bad');
            });
            const p2 = guard(async () => await guardedBehavior('world', 100));
            await (0, chai_1.expect)(p1).to.eventually.be.rejectedWith(/bad/);
            await (0, chai_1.expect)(p2).to.eventually.eql('world');
        });
    });
});
//# sourceMappingURL=util.e2e.spec.js.map