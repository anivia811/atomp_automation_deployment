/**
 * Default test host
 */
export declare const TEST_HOST = "127.0.0.1";
/**
 * Returns a free port; one per process
 * @param force - If true, do not reuse the port (if it already exists)
 * @returns a free port
 */
export declare function getTestPort(force?: boolean): Promise<number>;
/**
 * Build Appium server URLs for tests.
 *
 * Call with `(address, port)` to get `(session, pathname) => url`, or pass all four
 * arguments at once. Use `''` when session or pathname is omitted.
 */
export declare function createAppiumURL(address: string, port: string | number): (session: string, pathname: string) => string;
export declare function createAppiumURL(address: string, port: string | number, session: string, pathname: string): string;
//# sourceMappingURL=helpers.d.ts.map