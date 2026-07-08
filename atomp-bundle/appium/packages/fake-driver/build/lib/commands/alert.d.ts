import type { FakeDriver } from '../driver';
/** Throw if an alert is currently open (blocks other commands). */
export declare function assertNoAlert(this: FakeDriver): void;
/** Throw if no alert is open (required before get/set alert text, accept, etc.). */
export declare function assertAlert(this: FakeDriver): void;
/** getAlertText. */
export declare function getAlertText(this: FakeDriver): Promise<string>;
/** setAlertText. */
export declare function setAlertText(this: FakeDriver, text: string): Promise<void>;
/** postAcceptAlert. */
export declare function postAcceptAlert(this: FakeDriver): Promise<void>;
/** In this fake, dismiss is the same as accept. */
export declare function postDismissAlert(this: FakeDriver): Promise<void>;
//# sourceMappingURL=alert.d.ts.map