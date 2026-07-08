export declare const EXECUTE_METHOD_MAP: {
    readonly 'fake: addition': {
        readonly command: "fakeAddition";
        readonly params: {
            readonly required: readonly ["num1", "num2"];
            readonly optional: readonly ["num3"];
        };
    };
    readonly 'fake: getThing': {
        readonly command: "getFakeThing";
    };
    readonly 'fake: setThing': {
        readonly command: "setFakeThing";
        readonly params: {
            readonly required: readonly ["thing"];
        };
    };
    readonly 'fake: getDeprecatedCommandsCalled': {
        readonly command: "getDeprecatedCommandsCalled";
    };
    readonly 'fake: getLastPluginMath': {
        readonly command: "getLastPluginMath";
    };
    readonly 'fake: startClock': {
        readonly command: "fakeStartClock";
    };
    readonly 'fake: stopClock': {
        readonly command: "fakeStopClock";
    };
};
//# sourceMappingURL=execute-method-map.d.ts.map