import sinon from 'sinon';
export declare function setupWriters(): {
    stdout: sinon.SinonSpy<[str: string | Uint8Array<ArrayBufferLike>, encoding?: BufferEncoding | undefined, cb?: ((err?: Error | null) => void) | undefined], boolean>;
    stderr: sinon.SinonSpy<[str: string | Uint8Array<ArrayBufferLike>, encoding?: BufferEncoding | undefined, cb?: ((err?: Error | null) => void) | undefined], boolean>;
};
export declare function getDynamicLogger(testingMode: boolean, forceLogs: boolean, prefix?: string | (() => string) | null): import("../../../../types/build/lib").AppiumLogger;
/** Restore stubs; signature kept for API compatibility with callers that pass writers. */
export declare function restoreWriters(writers: ReturnType<typeof setupWriters>): void;
export declare function assertOutputContains(writers: ReturnType<typeof setupWriters>, output: string): void;
export declare function assertOutputDoesntContain(writers: ReturnType<typeof setupWriters>, output: string): void;
//# sourceMappingURL=helpers.d.ts.map