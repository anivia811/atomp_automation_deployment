"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schema = {
    type: 'object',
    title: 'Fake Driver Configuration',
    description: 'A schema for Fake Driver arguments',
    properties: {
        'silly-web-server-port': {
            type: 'integer',
            minimum: 1,
            maximum: 65535,
            description: 'The port to use for the fake web server',
        },
        sillyWebServerHost: {
            type: 'string',
            description: 'The host to use for the fake web server',
            default: 'sillyhost',
        },
    },
};
exports.default = schema;
//# sourceMappingURL=fake-driver-schema.js.map