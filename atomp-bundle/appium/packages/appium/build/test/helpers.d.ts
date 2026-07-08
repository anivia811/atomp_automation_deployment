import rewiremock from 'rewiremock';
declare const TEST_HOST = "127.0.0.1";
declare const FAKE_DRIVER_DIR: string;
declare const FAKE_PLUGIN_DIR: string;
/** This is the monorepo root. */
declare const PROJECT_ROOT: string;
/** Path to Appium package */
declare const APPIUM_ROOT: string;
/** Path to fake app fixture `.xml` (as understood by `FakeDriver`) */
declare const TEST_FAKE_APP: string;
declare const BASE_CAPS: {
    automationName: string;
    platformName: string;
    deviceName: string;
    app: string;
};
declare const W3C_PREFIXED_CAPS: {
    [x: `appium:${string}`]: unknown;
};
declare const W3C_CAPS: {
    alwaysMatch: {
        [x: `appium:${string}`]: unknown;
    };
    firstMatch: {}[];
};
declare function getTestPort(): Promise<number>;
declare function resolveFixture(filename: string, ...pathParts: string[]): string;
export { TEST_FAKE_APP, TEST_HOST, BASE_CAPS, W3C_PREFIXED_CAPS, W3C_CAPS, PROJECT_ROOT, getTestPort, rewiremock, resolveFixture, FAKE_DRIVER_DIR, FAKE_PLUGIN_DIR, APPIUM_ROOT, };
//# sourceMappingURL=helpers.d.ts.map