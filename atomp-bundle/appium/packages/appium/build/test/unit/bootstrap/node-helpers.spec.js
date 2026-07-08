"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const node_fs_1 = require("node:fs");
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const node_helpers_1 = require("../../../lib/bootstrap/node-helpers");
const { expect } = chai_1.default;
chai_1.default.use(chai_as_promised_1.default);
describe('bootstrap/node-helpers', function () {
    describe('checkNodeOk()', function () {
        const _process = process;
        before(function () {
            process = { ...process }; // eslint-disable-line no-global-assign
        });
        after(function () {
            process = _process; // eslint-disable-line no-global-assign
        });
        describe('unsupported nodes', function () {
            const unsupportedVersions = [
                'v0.1',
                'v0.9.12',
                'v0.10.36',
                'v0.12.14',
                'v4.4.7',
                'v5.7.0',
                'v6.3.1',
                'v7.1.1',
                'v8.0.0',
                'v9.2.3',
                'v10.1.0',
                'v11.0.0',
                'v12.0.0',
                'v14.0.0',
                'v14.17.0',
                'v14.17.5',
                'v16.0.0',
                'v20.18.0',
                'v22.10.0',
            ];
            for (const version of unsupportedVersions) {
                it(`should fail if node is ${version}`, function () {
                    // @ts-expect-error
                    process.version = version;
                    expect(node_helpers_1.checkNodeOk).to.throw();
                });
            }
        });
        describe('supported nodes', function () {
            it('should succeed if node is ^20.19.0', function () {
                // @ts-expect-error
                process.version = 'v20.19.0';
                expect(node_helpers_1.checkNodeOk).to.not.throw();
                // @ts-expect-error
                process.version = 'v20.100.0';
                expect(node_helpers_1.checkNodeOk).to.not.throw();
            });
            it('should succeed if node is 22.12+', function () {
                // @ts-expect-error
                process.version = 'v22.12.0';
                expect(node_helpers_1.checkNodeOk).to.not.throw();
                // @ts-expect-error
                process.version = 'v100.0.0';
                expect(node_helpers_1.checkNodeOk).to.not.throw();
            });
        });
    });
    describe('requireDir()', function () {
        it('should fail to use a dir with incorrect permissions', async function () {
            await expect((0, node_helpers_1.requireDir)('/private/if_you_run_with_sudo_this_wont_fail')).to.be.rejectedWith(/must exist/);
        });
        it('should fail to use an undefined dir', async function () {
            // @ts-expect-error
            await expect((0, node_helpers_1.requireDir)()).to.be.rejectedWith(/must exist/);
        });
        it('should fail to use a non-writeable dir', async function () {
            const tempDir = await node_fs_1.promises.mkdtemp(node_path_1.default.join(node_os_1.default.tmpdir(), 'appium-requireDir-test-'));
            try {
                await node_fs_1.promises.chmod(tempDir, 0o444);
                await expect((0, node_helpers_1.requireDir)(tempDir)).to.be.rejectedWith(/must be writeable/);
            }
            finally {
                await node_fs_1.promises.chmod(tempDir, 0o700);
                await node_fs_1.promises.rmdir(tempDir);
            }
        });
        it('should be able to use a dir with correct permissions', async function () {
            await expect((0, node_helpers_1.requireDir)('/tmp/test_tmp_dir/with/any/number/of/levels')).to.not.be.rejected;
        });
    });
    describe('adjustNodePath()', function () {
        const prevValue = process.env.NODE_PATH;
        beforeEach(function () {
            if (process.env.NODE_PATH) {
                delete process.env.NODE_PATH;
            }
        });
        afterEach(function () {
            if (prevValue) {
                process.env.NODE_PATH = prevValue;
            }
        });
        it('should adjust NODE_PATH', async function () {
            (0, node_helpers_1.adjustNodePath)();
            await expect(node_fs_1.promises.access(process.env.NODE_PATH)).to.not.be.rejected;
        });
    });
});
//# sourceMappingURL=node-helpers.spec.js.map