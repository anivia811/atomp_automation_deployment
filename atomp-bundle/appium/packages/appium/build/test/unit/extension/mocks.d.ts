/**
 * A collection of mocks reused across unit tests.
 */
import { EventEmitter } from 'node:events';
import { type SinonSandbox, type SinonStub } from 'sinon';
import { util as supportUtil } from '@appium/support';
export interface MockAppiumSupportFs {
    readFile: SinonStub;
    writeFile: SinonStub;
    walk: SinonStub;
    glob: SinonStub;
    mkdirp: SinonStub;
    exists: SinonStub;
}
export interface MockAppiumSupportEnv {
    resolveAppiumHome: SinonStub;
    resolveManifestPath: SinonStub;
    hasAppiumDependency: SinonStub;
    readPackageInDir: SinonStub;
    __pkg: {
        name: string;
        version: string;
        readme: string;
        _id: string;
    };
}
export interface MockAppiumSupportLogger {
    getLogger: SinonStub;
    __logger: SinonStub;
}
export interface MockAppiumSupportSystem {
    isWindows: SinonStub;
}
export interface MockAppiumSupportNpm {
    getLatestVersion: SinonStub;
    getLatestSafeUpgradeVersion: SinonStub;
}
export type MockAppiumSupportUtil = typeof supportUtil & {
    compareVersions: SinonStub;
};
export interface MockAppiumSupportConsole {
    CliConsole: SinonStub;
}
export interface MockAppiumSupport {
    fs: MockAppiumSupportFs;
    env: MockAppiumSupportEnv;
    logger: MockAppiumSupportLogger;
    system: MockAppiumSupportSystem;
    npm: MockAppiumSupportNpm;
    util: MockAppiumSupportUtil;
    console: MockAppiumSupportConsole;
}
export interface MockPackageChanged {
    isPackageChanged: SinonStub;
    __writeHash: SinonStub;
}
export interface MockResolveFrom extends SinonStub<[cwd: string, id: string], Promise<string>> {
    (cwd: string, id: string): Promise<string>;
}
export interface MockGlob extends SinonStub {
    (spec: string, opts: {
        cwd: string;
    }, done: () => void): EventEmitter;
}
export interface Overrides {
    '@appium/support': MockAppiumSupport;
    '../../../lib/utils/resolve-from': {
        resolveFrom: MockResolveFrom;
    };
    '../../../lib/utils/is-package-changed': MockPackageChanged;
    glob: MockGlob;
}
export interface InitMocksResult {
    MockAppiumSupport: MockAppiumSupport;
    MockPackageChanged: MockPackageChanged;
    MockResolveFrom: MockResolveFrom;
    MockGlob: MockGlob;
    sandbox: SinonSandbox;
    overrides: Overrides;
}
export declare function initMocks(sandbox?: SinonSandbox): InitMocksResult;
//# sourceMappingURL=mocks.d.ts.map