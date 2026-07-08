export declare const desiredCapConstraints: {
    readonly app: {
        readonly presence: true;
        readonly isString: true;
    };
    readonly uniqueApp: {
        readonly isBoolean: true;
    };
    readonly runClock: {
        readonly isBoolean: true;
    };
};
export type FakeDriverConstraints = typeof desiredCapConstraints;
//# sourceMappingURL=desired-caps.d.ts.map