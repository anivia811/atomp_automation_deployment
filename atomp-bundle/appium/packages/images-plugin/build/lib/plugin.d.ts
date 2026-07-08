import { BasePlugin } from 'appium/plugin';
import { ImageElementFinder } from './finder';
import type { ExternalDriver, ActionSequence, MethodMap } from '@appium/types';
import type { MatchingOptions, SimilarityOptions, OccurrenceOptions } from '@appium/opencv';
export declare class ImageElementPlugin extends BasePlugin {
    static newMethodMap: MethodMap<ImageElementPlugin>;
    readonly finder: ImageElementFinder;
    constructor(pluginName: string);
    compareImages(next: () => Promise<any>, driver: ExternalDriver, mode: string, firstImage: string | Buffer, secondImage: string | Buffer, options?: MatchingOptions | SimilarityOptions | OccurrenceOptions): Promise<any>;
    findElement(next: () => Promise<any>, driver: ExternalDriver, ...args: any[]): Promise<any>;
    findElements(next: () => Promise<any>, driver: ExternalDriver, ...args: any[]): Promise<any>;
    handle(next: () => Promise<any>, driver: ExternalDriver, cmdName: string, ...args: any[]): Promise<any>;
    performActions(next: () => Promise<any>, driver: ExternalDriver, actionSequences: ActionSequence[]): Promise<any>;
    private _find;
}
/**
 * Returns the first image-element id found in command args.
 * @param args Command arguments.
 */
export declare function getImgElFromArgs(args: any[]): string | undefined;
//# sourceMappingURL=plugin.d.ts.map