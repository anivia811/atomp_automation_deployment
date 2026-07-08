import type { ActionSequence, Location, Rect, Size, Orientation } from '@appium/types';
import type { FakeDriver } from '../driver';
/** Requires webview context (title comes from active document). */
export declare function title(this: FakeDriver): Promise<string>;
/** keys. */
export declare function keys(this: FakeDriver, value: string | string[]): Promise<void>;
/** setGeoLocation. */
export declare function setGeoLocation(this: FakeDriver, location: Location): Promise<Location>;
/** getGeoLocation. */
export declare function getGeoLocation(this: FakeDriver): Promise<Location>;
/** getPageSource. */
export declare function getPageSource(this: FakeDriver): Promise<string>;
/** getOrientation. */
export declare function getOrientation(this: FakeDriver): Promise<string>;
/** setOrientation. */
export declare function setOrientation(this: FakeDriver, o: Orientation): Promise<void>;
/** getScreenshot. */
export declare function getScreenshot(this: FakeDriver): Promise<string>;
/** getWindowSize. */
export declare function getWindowSize(this: FakeDriver): Promise<Size>;
/** getWindowRect. */
export declare function getWindowRect(this: FakeDriver): Promise<Rect>;
/** performActions. */
export declare function performActions(this: FakeDriver, actions: ActionSequence[]): Promise<void>;
/** releaseActions. */
export declare function releaseActions(this: FakeDriver): Promise<void>;
/** Supported log types: 'actions'. TODO: add more log types if needed for tests. */
export declare function getLog(this: FakeDriver, type: string): Promise<ActionSequence[][]>;
/** mobileShake. */
export declare function mobileShake(this: FakeDriver): Promise<void>;
/** doubleClick. */
export declare function doubleClick(this: FakeDriver): Promise<void>;
/** execute. */
export declare function execute(this: FakeDriver, script: string, args: any[]): Promise<any>;
/** fakeAddition. */
export declare function fakeAddition(this: FakeDriver, num1: number, num2: number, num3?: number): Promise<number>;
/** Get current URL. Returns empty string until bidiNavigate (or equivalent) sets one. @see https://w3c.github.io/webdriver/#get-current-url */
export declare function getUrl(this: FakeDriver): Promise<string>;
/** Set current URL (used by Bidi browsingContext.navigate). */
export declare function bidiNavigate(this: FakeDriver, context: string, url: string): Promise<void>;
/** Return the last math result detected by a plugin that publishes it */
export declare function getLastPluginMath(this: FakeDriver): Promise<{
    pluginName: string;
    result: number;
} | null>;
//# sourceMappingURL=general.d.ts.map