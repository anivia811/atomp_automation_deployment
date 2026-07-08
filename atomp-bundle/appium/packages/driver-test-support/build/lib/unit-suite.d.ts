import type { Constraints, Driver, DriverClass, NSDriverCaps } from '@appium/types';
/**
 * Creates unit test suites for a driver.
 */
export declare function driverUnitTestSuite<C extends Constraints>(DriverClass: DriverClass<Driver<C>>, defaultCaps?: NSDriverCaps<C>): void;
//# sourceMappingURL=unit-suite.d.ts.map