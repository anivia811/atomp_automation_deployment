"use strict";
/**
 * A collection of mocks reused across unit tests.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTERNAL_MODULE_OVERRIDE_KEY = void 0;
exports.initMocks = initMocks;
const sinon_1 = require("sinon");
/** Override key for rewiremock from `test/unit/*.spec.ts` → `lib/internal` (env imports `./internal`). */
exports.INTERNAL_MODULE_OVERRIDE_KEY = '../../lib/internal';
function initMocks(sandbox = (0, sinon_1.createSandbox)()) {
    const mockPkg = {
        name: 'mock-package',
        version: '1.0.0',
        readme: '# Mock Package!!',
        _id: 'mock-package',
    };
    const MockInternal = {
        readPackage: sandbox.stub().callsFake(async () => mockPkg),
        readPackageSync: sandbox.stub().returns(mockPkg),
        packageDirectorySync: sandbox.stub().callsFake(({ cwd } = {}) => cwd),
        __pkg: mockPkg,
    };
    const MockFs = {
        access: sandbox.stub().resolves(true),
    };
    const MockTeenProcess = {
        exec: sandbox.stub().callsFake(async () => ({
            stdout: MockTeenProcess.__stdout,
            stderr: MockTeenProcess.__stderr,
            code: MockTeenProcess.__code,
        })),
        __stdout: '',
        __stderr: '',
        __code: 0,
    };
    const overrides = {
        [exports.INTERNAL_MODULE_OVERRIDE_KEY]: MockInternal,
        teen_process: MockTeenProcess,
        fs: MockFs,
    };
    return {
        MockInternal,
        MockReadPackage: MockInternal,
        MockFs,
        MockTeenProcess,
        sandbox,
        overrides,
    };
}
//# sourceMappingURL=mocks.js.map