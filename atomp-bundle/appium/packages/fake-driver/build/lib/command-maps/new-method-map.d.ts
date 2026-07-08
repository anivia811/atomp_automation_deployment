export declare const NEW_METHOD_MAP: {
    readonly '/session/:sessionId/fakedriver': {
        readonly GET: {
            readonly command: "getFakeThing";
        };
        readonly POST: {
            readonly command: "setFakeThing";
            readonly payloadParams: {
                readonly required: readonly ["thing"];
            };
        };
    };
    readonly '/session/:sessionId/fakedriverargs': {
        readonly GET: {
            readonly command: "getFakeDriverArgs";
        };
    };
    readonly '/session/:sessionId/deprecated': {
        readonly POST: {
            readonly command: "callDeprecatedCommand";
            readonly deprecated: true;
        };
    };
    readonly '/session/:sessionId/doubleclick': {
        readonly POST: {
            readonly command: "doubleClick";
        };
    };
};
//# sourceMappingURL=new-method-map.d.ts.map