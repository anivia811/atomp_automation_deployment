import { BasePlugin } from 'appium/plugin';
import type { ExternalDriver, NextPluginCallback, Element } from '@appium/types';
export declare class UniversalXMLPlugin extends BasePlugin {
    getPageSource(next: NextPluginCallback | null, driver: ExternalDriver, sessId?: any, addIndexPath?: boolean): Promise<string>;
    findElement(next: NextPluginCallback, driver: ExternalDriver, strategy: string, selector: string): Promise<Element>;
    findElements(next: NextPluginCallback, driver: ExternalDriver, strategy: string, selector: string): Promise<Element[]>;
    private _find;
}
//# sourceMappingURL=plugin.d.ts.map