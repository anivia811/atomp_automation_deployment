/**
 * JSON Schema for Fake Driver CLI/server arguments.
 * Could be a .json file; kept as TS for consistency and type export.
 */
export interface FakeDriverSchema {
    type: 'object';
    title: string;
    description: string;
    properties: {
        'silly-web-server-port'?: {
            type: 'integer';
            minimum: number;
            maximum: number;
            description: string;
        };
        sillyWebServerHost?: {
            type: 'string';
            description: string;
            default?: string;
        };
    };
}
declare const schema: FakeDriverSchema;
export default schema;
//# sourceMappingURL=fake-driver-schema.d.ts.map