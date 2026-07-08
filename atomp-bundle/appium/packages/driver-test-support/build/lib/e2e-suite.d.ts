import type { BaseNSCapabilities, Driver, DriverClass } from '@appium/types';
import type { SessionHelpers } from './types';
/** Driver E2E caps may include server options beyond {@linkcode BaseNSCapabilities}. */
type DriverE2EDefaultCaps = Partial<BaseNSCapabilities> & {
    'appium:address'?: string;
    'appium:port'?: number;
    'appium:deviceName'?: string;
};
/**
 * Creates some helper functions for E2E tests to manage sessions.
 */
export declare function createSessionHelpers<CommandData = unknown, ResponseData = any>(port: number, address?: string): SessionHelpers<CommandData, ResponseData>;
/**
 * Creates E2E test suites for a driver.
 */
export declare function driverE2ETestSuite(DriverClass: DriverClass<Driver>, defaultCaps?: DriverE2EDefaultCaps): void;
export {};
//# sourceMappingURL=e2e-suite.d.ts.map