"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NEW_METHOD_MAP = void 0;
exports.NEW_METHOD_MAP = {
    '/session/:sessionId/fakedriver': {
        GET: { command: 'getFakeThing' },
        POST: { command: 'setFakeThing', payloadParams: { required: ['thing'] } },
    },
    '/session/:sessionId/fakedriverargs': {
        GET: { command: 'getFakeDriverArgs' },
    },
    '/session/:sessionId/deprecated': {
        POST: { command: 'callDeprecatedCommand', deprecated: true },
    },
    '/session/:sessionId/doubleclick': {
        POST: { command: 'doubleClick' },
    },
};
//# sourceMappingURL=new-method-map.js.map