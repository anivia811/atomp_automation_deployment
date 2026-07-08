import { BasePlugin } from 'appium/plugin';
import type { ExternalDriver, MethodMap, PluginCommand } from '@appium/types';
export declare class ExecuteDriverPlugin extends BasePlugin {
    static newMethodMap: MethodMap<ExecuteDriverPlugin>;
    /**
     * This method takes a string which is executed as javascript in the context of
     * a new nodejs VM, and which has available a webdriverio driver object, having
     * already been attached to the currently running session.
     *
     * @param next - standard behaviour for executeDriverScript
     * @param driver - Appium driver handling this command
     * @param script - the string representing the driver script to run
     * @param scriptType - the name of the driver script library (currently only webdriverio is supported). Defaults to `'webdriverio'`.
     * @param timeoutMs - timeout for the script process. Defaults to `3600000`.
     * @returns a JSONifiable object representing the return value of the script
     * @throws {Error}
     */
    executeDriverScript: PluginCommand<ExternalDriver, [
        script: string,
        scriptType?: string,
        timeoutMs?: number
    ], any>;
}
//# sourceMappingURL=plugin.d.ts.map