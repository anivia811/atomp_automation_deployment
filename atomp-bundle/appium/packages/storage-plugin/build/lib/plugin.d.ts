import { BasePlugin } from 'appium/plugin';
import type { Express } from 'express';
import type { AppiumServer } from '@appium/types';
export declare class StoragePlugin extends BasePlugin {
    static updateServer(expressApp: Express, httpServer: AppiumServer): Promise<void>;
}
export default StoragePlugin;
//# sourceMappingURL=plugin.d.ts.map