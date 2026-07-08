import type { ItemOptions, StorageItem } from './types';
import type { AppiumLogger } from '@appium/types';
import type Stream from 'node:stream';
import type WebSocket from 'ws';
export declare class Storage {
    private readonly _root;
    private readonly _log;
    private readonly _shouldPreserveRoot;
    private readonly _shouldPreserveFiles;
    constructor(root: string, shouldPreserveRoot: boolean, shouldPreserveFiles: boolean, log: AppiumLogger);
    list(): Promise<StorageItem[]>;
    add(opts: ItemOptions, source: Stream | WebSocket): Promise<void>;
    delete(name: string): Promise<boolean>;
    reset(): Promise<void>;
    cleanupSync(): void;
    private _listFiles;
    private _addFromStream;
    private _addFromWebSocket;
    private _finalizeItem;
}
export declare class StorageArgumentError extends Error {
}
/**
 * Validates storage item options and returns the same object when valid.
 * @param opts Candidate item options.
 */
export declare function requireValidItemOptions(opts: ItemOptions): ItemOptions;
/**
 * Validate storage item name and throw if it is invalid.
 * @param name The name to validate.
 */
export declare function validateStorageItemName(name: string): void;
//# sourceMappingURL=storage.d.ts.map