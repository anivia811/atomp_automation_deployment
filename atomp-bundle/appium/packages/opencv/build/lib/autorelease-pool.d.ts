interface Deletable {
    delete(): void;
}
export declare class OpenCvAutoreleasePool {
    private readonly _items;
    constructor();
    add<T extends Deletable>(item: T): T;
    drain(): void;
}
export {};
//# sourceMappingURL=autorelease-pool.d.ts.map