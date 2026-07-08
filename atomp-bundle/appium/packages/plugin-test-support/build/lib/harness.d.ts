import type { AppiumServer } from '@appium/types';
import type { E2ESetupOpts } from './types';
/**
 * Creates hooks to install a driver and a plugin and starts an Appium server w/ the given extensions.
 *
 * @param opts - Options for the plugin E2E harness
 * @returns An object with `setup` and `teardown` callbacks
 * @throws {Error} If a free port could not be found
 * @throws {Error} If the Appium server could not be started
 * @throws {Error} If the driver could not be installed
 * @throws {Error} If the plugin could not be installed
 */
export declare function pluginE2EHarness(opts: E2ESetupOpts): {
    setup: () => Promise<{
        server: AppiumServer;
    }>;
    teardown: () => Promise<void>;
};
/**
 * Returns a first available free port number on the local machine.
 * The function call is race-free and thread-safe.
 *
 * @returns Port number
 * @throws {Error} If a free port could not be found
 */
export declare function getPort(): Promise<number>;
//# sourceMappingURL=harness.d.ts.map