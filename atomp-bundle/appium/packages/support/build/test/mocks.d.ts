/**
 * A collection of mocks reused across unit tests.
 */
import { type SinonSandbox, type SinonStub } from 'sinon';
/** Override key for rewiremock from `test/unit/*.spec.ts` → `lib/internal` (env imports `./internal`). */
export declare const INTERNAL_MODULE_OVERRIDE_KEY: "../../lib/internal";
import type { NormalizedPackageJson } from '../lib/internal/read-package';
export interface MockInternal {
    readPackage: SinonStub;
    readPackageSync: SinonStub;
    packageDirectorySync: SinonStub;
    __pkg: NormalizedPackageJson;
}
/** @deprecated Use {@link MockInternal} */
export type MockReadPackage = MockInternal;
export interface MockFs {
    access: SinonStub;
}
export interface MockTeenProcess {
    exec: SinonStub;
    __stdout: string;
    __stderr: string;
    __code: number;
}
export interface Overrides {
    [INTERNAL_MODULE_OVERRIDE_KEY]: MockInternal;
    teen_process: MockTeenProcess;
    fs: MockFs;
}
export interface InitMocksResult {
    MockInternal: MockInternal;
    /** @deprecated Use {@link MockInternal} */
    MockReadPackage: MockInternal;
    MockFs: MockFs;
    MockTeenProcess: MockTeenProcess;
    sandbox: SinonSandbox;
    overrides: Overrides;
}
export declare function initMocks(sandbox?: SinonSandbox): InitMocksResult;
//# sourceMappingURL=mocks.d.ts.map