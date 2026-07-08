import type { FakeDriver } from '../driver';
/** NATIVE_APP, PROXY, and WEBVIEW_1, WEBVIEW_2, ... from app model. */
export declare function getRawContexts(this: FakeDriver): Record<string, unknown>;
/** Throw if current context is NATIVE_APP (e.g. CSS/title require a webview). */
export declare function assertWebviewContext(this: FakeDriver): void;
/** getCurrentContext. */
export declare function getCurrentContext(this: FakeDriver): Promise<string>;
/** getContexts. */
export declare function getContexts(this: FakeDriver): Promise<string[]>;
/** setContext. */
export declare function setContext(this: FakeDriver, context: string): Promise<void>;
/** setFrame. */
export declare function setFrame(this: FakeDriver, frameId: number | null): Promise<void>;
//# sourceMappingURL=contexts.d.ts.map