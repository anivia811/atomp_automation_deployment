"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sinon_1 = require("sinon");
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const constants_1 = require("../../../lib/constants");
const schema_1 = require("@appium/schema");
const arg_spec_1 = require("../../../lib/schema/arg-spec");
const default_args_1 = __importDefault(require("../../fixtures/default-args"));
const driver_schema_1 = __importDefault(require("../../fixtures/driver-schema"));
const flattened_schema_1 = __importDefault(require("../../fixtures/flattened-schema"));
const helpers_1 = require("../../helpers");
const { expect } = chai_1.default;
chai_1.default.use(chai_as_promised_1.default);
describe('schema', function () {
    let sandbox;
    let SchemaFinalizationError;
    let SchemaUnknownSchemaError;
    let SchemaUnsupportedSchemaError;
    let resetSchema;
    let registerSchema;
    let getSchema;
    let finalizeSchema;
    let getDefaultsForSchema;
    let flattenSchema;
    let isFinalized;
    let validate;
    let RoachHotelMap;
    let mocks;
    beforeEach(function () {
        sandbox = (0, sinon_1.createSandbox)();
        mocks = {
            '@sidvind/better-ajv-errors': sandbox.stub(),
        };
        ({
            SchemaFinalizationError,
            SchemaUnknownSchemaError,
            SchemaUnsupportedSchemaError,
            RoachHotelMap,
            resetSchema,
            registerSchema,
            getSchema,
            isFinalized,
            finalizeSchema,
            getDefaultsForSchema,
            flattenSchema,
            validate,
        } = helpers_1.rewiremock.proxy(() => require('../../../lib/schema/schema'), mocks));
        resetSchema();
    });
    afterEach(function () {
        sandbox.restore();
    });
    describe('registerSchema()', function () {
        describe('error conditions', function () {
            describe('when provided no parameters', function () {
                it('should throw a TypeError', async function () {
                    await expect(registerSchema()).to.be.rejectedWith(TypeError, /expected extension type/i);
                });
            });
            describe('when provided `type` and `name`, but not `schema`', function () {
                it('should throw a TypeError', async function () {
                    await expect(registerSchema(constants_1.DRIVER_TYPE, 'whoopeee')).to.be.rejectedWith(TypeError, /expected extension type/i);
                });
            });
            describe('when provided `type` and nonempty `schema`, but no `name`', function () {
                it('should throw a TypeError', async function () {
                    await expect(registerSchema(constants_1.DRIVER_TYPE, undefined, {
                        title: 'whoopeee',
                    })).to.be.rejectedWith(TypeError, /expected extension type/i);
                });
            });
            describe('when the schema is of an unsupported type', function () {
                describe('when schema is an object but not a plain object', function () {
                    it('should throw', async function () {
                        await expect(registerSchema(constants_1.DRIVER_TYPE, 'whoopeee', [45])).to.be.rejectedWith(SchemaUnsupportedSchemaError, /must be a plain object/i);
                    });
                });
                describe('when the schema is async', function () {
                    it('should throw', async function () {
                        await expect(registerSchema(constants_1.DRIVER_TYPE, 'whoopee', {
                            $async: true,
                        })).to.be.rejectedWith(SchemaUnsupportedSchemaError, /cannot be an async schema/i);
                    });
                });
                describe('when the schema is boolean', function () {
                    it('should throw', async function () {
                        await expect(registerSchema(constants_1.DRIVER_TYPE, 'whoopee', true)).to.be.rejectedWith(SchemaUnsupportedSchemaError);
                    });
                });
            });
            describe('when schema previously registered', function () {
                describe('when the schema is identical', function () {
                    it('should not throw', async function () {
                        const schemaObject = { title: 'whoopee' };
                        await registerSchema(constants_1.DRIVER_TYPE, 'whoopee', schemaObject);
                        await expect(registerSchema(constants_1.DRIVER_TYPE, 'whoopee', schemaObject)).to.be.fulfilled;
                    });
                });
                describe('when the schema is different', function () {
                    it('should throw', async function () {
                        const schemaObject = { title: 'whoopee' };
                        await registerSchema(constants_1.DRIVER_TYPE, 'whoopee', schemaObject);
                        await expect(registerSchema(constants_1.DRIVER_TYPE, 'whoopee', {
                            title: 'cushion?',
                        })).to.be.rejectedWith(Error, /conflicts with an existing schema/);
                    });
                });
            });
        });
        describe('when provided a nonempty `type`, `schema` and `name`', function () {
            it('should register the schema', async function () {
                const schemaObject = { title: 'whoopee' };
                await expect(registerSchema(constants_1.DRIVER_TYPE, 'whoopee', schemaObject)).to.be.fulfilled;
            });
            describe('when the `name` is not unique but `type` is', function () {
                it('should register both', async function () {
                    const schema1 = { title: 'pro-skub' };
                    const schema2 = { title: 'anti-skub' };
                    await registerSchema(constants_1.DRIVER_TYPE, 'skub', schema1);
                    await expect(registerSchema(constants_1.PLUGIN_TYPE, 'skub', schema2)).to.be.fulfilled;
                });
            });
        });
    });
    describe('getSchema()', function () {
        describe('when schema not yet compiled', function () {
            it('should throw', function () {
                expect(() => getSchema()).to.throw(SchemaFinalizationError);
            });
        });
        describe('when schema already compiled', function () {
            beforeEach(async function () {
                await finalizeSchema();
            });
            it('should return a schema', function () {
                expect(getSchema()).to.eql(schema_1.AppiumConfigJsonSchema);
            });
        });
        describe('when schema already compiled and provided a schema ID', function () {
            beforeEach(async function () {
                await finalizeSchema();
            });
            describe('when schema ID is the base schema ID', function () {
                it('should return the base schema', function () {
                    expect(getSchema(arg_spec_1.APPIUM_CONFIG_SCHEMA_ID)).to.eql(schema_1.AppiumConfigJsonSchema);
                });
            });
            describe('when the schema ID is a reference', function () {
                it('should return the schema for the reference', function () {
                    expect(getSchema(`${arg_spec_1.APPIUM_CONFIG_SCHEMA_ID}#/properties/server/properties/address`)).to.exist.and.to.eql(schema_1.AppiumConfigJsonSchema.properties.server.properties.address);
                });
            });
            describe('when schema ID is invalid', function () {
                it('should throw', function () {
                    expect(() => getSchema('schema-the-clown')).to.throw(SchemaUnknownSchemaError);
                });
            });
        });
        describe('when schema already compiled including an extension', function () {
            beforeEach(async function () {
                await registerSchema(constants_1.DRIVER_TYPE, 'stuff', driver_schema_1.default);
                await finalizeSchema();
            });
            it('should return the extension schema', function () {
                expect(getSchema('driver-stuff.json')).to.eql(driver_schema_1.default);
            });
        });
    });
    describe('getDefaultsForSchema()', function () {
        describe('when schema not yet compiled', function () {
            it('should throw', function () {
                expect(() => getDefaultsForSchema()).to.throw(SchemaFinalizationError);
            });
        });
        describe('when schema already compiled', function () {
            it('should return a Record object with only defined default values', async function () {
                await finalizeSchema();
                const defaults = getDefaultsForSchema();
                expect(defaults).to.eql(default_args_1.default);
            });
            describe('when extension schemas include defaults', function () {
                it('should return a Record object containing defaults for the extensions', async function () {
                    await registerSchema(constants_1.DRIVER_TYPE, 'stuff', driver_schema_1.default);
                    await finalizeSchema();
                    const defaults = getDefaultsForSchema();
                    expect(defaults).to.have.property('driver.stuff.answer', 50);
                });
            });
        });
    });
    describe('flattenSchema()', function () {
        describe('when schema not yet compiled', function () {
            it('should throw', function () {
                expect(() => flattenSchema()).to.throw(SchemaFinalizationError);
            });
        });
        describe('when schema compiled', function () {
            beforeEach(async function () {
                resetSchema();
                await finalizeSchema();
            });
            it('should flatten a schema', function () {
                expect(flattenSchema().length).to.be.greaterThanOrEqual(flattened_schema_1.default.length);
            });
        });
        describe('when extensions provide schemas', function () {
            let expected;
            beforeEach(async function () {
                await registerSchema(constants_1.DRIVER_TYPE, 'fake', require('@appium/fake-driver/build/lib/fake-driver-schema').default);
                await finalizeSchema();
                expected = [
                    ...flattened_schema_1.default,
                    {
                        schema: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 65535,
                            description: 'The port to use for the fake web server',
                        },
                        argSpec: {
                            name: 'silly-web-server-port',
                            extType: constants_1.DRIVER_TYPE,
                            extName: 'fake',
                            ref: 'driver-fake.json#/properties/silly-web-server-port',
                            arg: 'driver-fake-silly-web-server-port',
                            dest: 'driver.fake.sillyWebServerPort',
                            rawDest: 'sillyWebServerPort',
                            defaultValue: undefined,
                        },
                    },
                    {
                        schema: {
                            type: 'string',
                            description: 'The host to use for the fake web server',
                            default: 'sillyhost',
                        },
                        argSpec: {
                            name: 'sillyWebServerHost',
                            extType: constants_1.DRIVER_TYPE,
                            extName: 'fake',
                            ref: 'driver-fake.json#/properties/sillyWebServerHost',
                            arg: 'driver-fake-silly-web-server-host',
                            dest: 'driver.fake.sillyWebServerHost',
                            rawDest: 'sillyWebServerHost',
                            defaultValue: 'sillyhost',
                        },
                    },
                ];
            });
            it('should flatten a schema', function () {
                expect(flattenSchema().length).to.be.greaterThanOrEqual(expected.length);
            });
        });
    });
    describe('finalizeSchema()', function () {
        describe('when no extensions registered schemas', function () {
            it('should return a Record containing the single base schema', async function () {
                expect(await finalizeSchema()).to.eql({
                    [arg_spec_1.APPIUM_CONFIG_SCHEMA_ID]: schema_1.AppiumConfigJsonSchema,
                });
            });
        });
        describe('when extensions register schemas', function () {
            beforeEach(async function () {
                await registerSchema(constants_1.DRIVER_TYPE, 'stuff', driver_schema_1.default);
            });
            it('should return a Record containing all extension schemas and the base schema', async function () {
                const baseSchemaWithRefs = structuredClone(schema_1.AppiumConfigJsonSchema);
                baseSchemaWithRefs.properties.server.properties.driver.properties.stuff = {
                    $ref: 'driver-stuff.json',
                    $comment: 'stuff',
                };
                expect(await finalizeSchema()).to.eql({
                    [arg_spec_1.APPIUM_CONFIG_SCHEMA_ID]: baseSchemaWithRefs,
                    'driver-stuff.json': driver_schema_1.default,
                });
            });
        });
    });
    describe('isFinalized()', function () {
        describe('when the schema is finalized', function () {
            it('should return true', async function () {
                await finalizeSchema();
                expect(isFinalized()).to.be.true;
            });
        });
        describe('when the schema is not finalized', function () {
            it('should return false', function () {
                resetSchema();
                expect(isFinalized()).to.be.false;
            });
        });
    });
    describe('validate()', function () {
        describe('when schema not yet compiled', function () {
            it('should throw', function () {
                expect(() => validate('foo')).to.throw(SchemaFinalizationError);
            });
        });
        describe('when schema already compiled, with no extensions', function () {
            beforeEach(async function () {
                await finalizeSchema();
            });
            describe('when provided an invalid schema ID ref', function () {
                it('should throw', function () {
                    expect(() => validate('foo', 'bar')).to.throw(SchemaUnknownSchemaError);
                });
            });
            describe('when not provided a schema ID ref', function () {
                describe('when provided a valid value', function () {
                    it('should return an empty array of no errors', function () {
                        expect(validate({ server: { address: '127.0.0.1' } })).to.eql([]);
                    });
                });
                describe('when provided an invalid value', function () {
                    it('should return an array containing errors', function () {
                        expect(validate({ address: '127.0.0.1' })).to.be.an('array').and.to.not.be.empty;
                    });
                });
            });
            describe('when provided a schema ID ref', function () {
                describe('when provided a valid value', function () {
                    it('should return an empty array of no errors', function () {
                        expect(validate('127.0.0.1', 'appium.json#/properties/server/properties/address')).to.eql([]);
                    });
                });
                describe('when provided an invalid value', function () {
                    it('should return an array containing errors', function () {
                        expect(validate('127.0.0.1', 'appium.json#/properties/server/properties/port')).to.be.an('array').and.to.not.be.empty;
                    });
                });
            });
        });
        describe('when schema already compiled, with extensions', function () {
            beforeEach(async function () {
                await registerSchema(constants_1.DRIVER_TYPE, 'stuff', driver_schema_1.default);
                await finalizeSchema();
            });
            describe('when provided an invalid schema ID ref', function () {
                it('should throw', function () {
                    expect(() => validate('foo', 'bar')).to.throw(SchemaUnknownSchemaError);
                });
            });
            describe('when not provided a schema ID ref', function () {
                describe('when provided a valid value', function () {
                    it('should return an empty array of no errors', function () {
                        expect(validate({ server: { driver: { stuff: { answer: 99 } } } })).to.eql([]);
                    });
                });
                describe('when provided an invalid value', function () {
                    it('should return an array containing errors', function () {
                        expect(validate({ server: { driver: { stuff: { answer: 101 } } } })).to.be.an('array').and.to
                            .not.be.empty;
                    });
                });
            });
            describe('when provided a schema ID ref', function () {
                describe('when provided a valid value', function () {
                    it('should return an empty array of no errors', function () {
                        expect(validate(99, 'driver-stuff.json#/properties/answer')).to.eql([]);
                    });
                });
                describe('when provided an invalid value', function () {
                    it('should return an array containing errors', function () {
                        expect(validate(101, 'driver-stuff.json#/properties/answer')).to.be.an('array').and.to
                            .not.be.empty;
                    });
                });
            });
        });
    });
    describe('RoachHotelMap', function () {
        it('should allow writing', function () {
            const map = new RoachHotelMap();
            expect(() => map.set('foo', 'bar')).not.to.throw();
        });
        it('should allow reading', function () {
            const map = new RoachHotelMap([['foo', 'bar']]);
            expect(() => map.get('foo')).not.to.throw();
        });
        it('should not allow deletion', function () {
            const map = new RoachHotelMap([['foo', 'bar']]);
            expect(map.delete('foo')).to.be.false;
        });
        it('should not allow clearing', function () {
            const map = new RoachHotelMap([['foo', 'bar']]);
            expect(() => map.clear()).to.throw();
        });
        it('should not allow updating', function () {
            const map = new RoachHotelMap([['foo', 'bar']]);
            expect(() => map.set('foo', 'baz')).to.throw();
        });
    });
});
//# sourceMappingURL=schema.spec.js.map