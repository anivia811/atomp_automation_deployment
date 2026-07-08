import { remote as wdio } from 'webdriverio';
declare const TEST_HOST = "127.0.0.1";
declare const TEST_PORT = 4774;
declare const TEST_APP: string;
declare const BASE_CAPS: {
    platformName: string;
    deviceName: string;
    app: string;
    address: string;
    port: number;
};
declare const W3C_PREFIXED_CAPS: {
    'appium:deviceName': string;
    'appium:app': string;
    'appium:address': string;
    'appium:port': number;
    platformName: string;
};
declare const W3C_CAPS: {
    alwaysMatch: {
        'appium:deviceName': string;
        'appium:app': string;
        'appium:address': string;
        'appium:port': number;
        platformName: string;
    };
    firstMatch: {}[];
};
declare const WD_OPTS: {
    hostname: string;
    port: number;
    connectionRetryCount: number;
    logLevel: "error";
};
declare function initSession(w3cPrefixedCaps: object): Promise<WebdriverIO.Browser>;
declare function deleteSession(driver: Awaited<ReturnType<typeof wdio>>): Promise<void>;
export { initSession, deleteSession, TEST_APP, TEST_HOST, TEST_PORT, BASE_CAPS, W3C_CAPS, W3C_PREFIXED_CAPS, WD_OPTS, };
//# sourceMappingURL=helpers.d.ts.map