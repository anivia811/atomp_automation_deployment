"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const node_fs_1 = require("node:fs");
const manifest_1 = require("../../../lib/extension/manifest");
const schema_1 = require("../../../lib/schema");
const helpers_1 = require("../../helpers");
const mocks_1 = require("./mocks");
const { expect } = chai_1.default;
chai_1.default.use(chai_as_promised_1.default);
describe('PluginConfig', function () {
    let yamlFixture;
    let manifest;
    let sandbox;
    let MockAppiumSupport;
    let MockResolveFrom;
    let PluginConfig;
    before(async function () {
        yamlFixture = await node_fs_1.promises.readFile((0, helpers_1.resolveFixture)('manifest', 'v3.yaml'), 'utf8');
    });
    beforeEach(function () {
        let overrides;
        manifest = manifest_1.Manifest.getInstance('/somewhere/');
        ({ MockAppiumSupport, MockResolveFrom, sandbox, overrides } = (0, mocks_1.initMocks)());
        MockAppiumSupport.fs.readFile.resolves(yamlFixture);
        ({ PluginConfig } = helpers_1.rewiremock.proxy(() => require('../../../lib/extension/plugin-config'), overrides));
        (0, schema_1.resetSchema)();
    });
    afterEach(function () {
        sandbox.restore();
    });
    describe('class method', function () {
        describe('create()', function () {
            describe('when the PluginConfig is not yet associated with a Manifest', function () {
                it('should return a new PluginConfig', function () {
                    const config = PluginConfig.create(manifest);
                    expect(config).to.be.an.instanceof(PluginConfig);
                });
                it('should be associated with the Manifest', function () {
                    const config = PluginConfig.create(manifest);
                    expect(config.manifest).to.equal(manifest);
                });
            });
            describe('when the PluginConfig is associated with a Manifest', function () {
                beforeEach(function () {
                    PluginConfig.create(manifest);
                });
                it('should throw', function () {
                    expect(() => PluginConfig.create(manifest)).to.throw(Error, new RegExp(`Manifest with APPIUM_HOME ${manifest.appiumHome} already has a PluginConfig`, 'i'));
                });
            });
        });
        describe('getInstance()', function () {
            describe('when the Manifest is not yet associated with a PluginConfig', function () {
                it('should return undefined', function () {
                    expect(PluginConfig.getInstance(manifest)).to.be.undefined;
                });
            });
            describe('when the Manifest is associated with a PluginConfig', function () {
                let driverConfig;
                beforeEach(function () {
                    driverConfig = PluginConfig.create(manifest);
                });
                it('should return the associated PluginConfig instance', function () {
                    expect(PluginConfig.getInstance(manifest)).to.equal(driverConfig);
                });
            });
        });
    });
    describe('instance method', function () {
        describe('extensionDesc()', function () {
            it('should return the description of the extension', function () {
                expect(PluginConfig.create(manifest).extensionDesc('foo', {
                    version: '1.0',
                    mainClass: 'Barrggh',
                    pkgName: 'herrbbbff',
                    installType: 'npm',
                    installSpec: 'herrbbbff',
                })).to.equal(`foo@1.0`);
            });
        });
        describe('getConfigProblems()', function () {
            let pluginConfig;
            beforeEach(function () {
                pluginConfig = PluginConfig.create(manifest);
            });
            describe('when provided no arguments', function () {
                it('should not throw', function () {
                    expect(() => pluginConfig.getConfigProblems()).not.to.throw();
                });
            });
        });
        describe('getSchemaProblems()', function () {
            let pluginConfig;
            beforeEach(function () {
                pluginConfig = PluginConfig.create(manifest);
            });
            describe('when provided an object with a defined `schema` property of unsupported type', function () {
                it('should return an array having an associated problem', async function () {
                    expect(await pluginConfig.getSchemaProblems({
                        schema: [],
                        mainClass: 'Asdsh',
                        pkgName: 'yodel',
                        version: '-1',
                    }, 'foo')).to.deep.include({
                        err: 'Incorrectly formatted schema field; must be a path to a schema file or a schema object.',
                        val: [],
                    });
                });
            });
            describe('when provided a string `schema` property', function () {
                describe('when the property ends in an unsupported extension', function () {
                    it('should return an array having an associated problem', async function () {
                        expect(await pluginConfig.getSchemaProblems({
                            schema: 'selenium.java',
                            mainClass: 'Asdsh',
                            pkgName: 'yodel',
                            version: '-1',
                            installType: 'npm',
                            installSpec: 'yodel',
                        }, 'foo')).to.deep.include({
                            err: 'Schema file has unsupported extension. Allowed: .json, .js, .cjs',
                            val: 'selenium.java',
                        });
                    });
                });
                describe('when the property contains a supported extension', function () {
                    describe('when the property as a path cannot be found', function () {
                        it('should return an array having an associated problem', async function () {
                            const problems = await pluginConfig.getSchemaProblems({
                                pkgName: 'doop',
                                schema: 'herp.json',
                                mainClass: 'Yankovic',
                                version: '1.0.0',
                            }, 'foo');
                            expect(problems)
                                .with.nested.property('[0].err')
                                .to.match(/Unable to register schema at path herp\.json/i);
                        });
                    });
                    describe('when the property as a path is found', function () {
                        beforeEach(function () {
                            MockResolveFrom.resolves((0, helpers_1.resolveFixture)('plugin-schema'));
                        });
                        it('should return an empty array', async function () {
                            await expect(pluginConfig.getSchemaProblems({
                                pkgName: '../fixtures',
                                schema: 'plugin-schema.js',
                                mainClass: 'Yankovic',
                                version: '1.0.0',
                            }, 'foo')).to.eventually.be.empty;
                        });
                    });
                });
            });
            describe('when provided an object `schema` property', function () {
                let externalManifest;
                describe('when the object is a valid schema', function () {
                    beforeEach(function () {
                        externalManifest = {
                            pkgName: 'foo',
                            version: '1.0.0',
                            installSpec: 'foo',
                            installType: 'npm',
                            mainClass: 'Barrggh',
                            schema: { type: 'object', properties: { foo: { type: 'string' } } },
                        };
                    });
                    it('should return an empty array', async function () {
                        await expect(pluginConfig.getSchemaProblems(externalManifest, 'foo')).to.eventually.be
                            .empty;
                    });
                });
                describe('when the object is an invalid schema', function () {
                    beforeEach(function () {
                        externalManifest = {
                            pkgName: 'foo',
                            version: '1.0.0',
                            installSpec: 'foo',
                            installType: 'npm',
                            mainClass: 'Barrggh',
                            schema: {
                                type: 'object',
                                properties: { foo: { type: 'string' } },
                                $async: true, // this is not allowed
                            },
                        };
                    });
                    it('should return an array having an associated problem', async function () {
                        expect(await pluginConfig.getSchemaProblems(externalManifest, 'foo'))
                            .with.nested.property('[0].err')
                            .to.match(/Unsupported schema/i);
                    });
                });
            });
        });
        describe('readExtensionSchema()', function () {
            let pluginConfig;
            let extData;
            const extName = 'stuff';
            beforeEach(function () {
                extData = {
                    pkgName: 'some-pkg',
                    schema: 'plugin-schema.js',
                    mainClass: 'SomeClass',
                    version: '0.0.0',
                    installType: 'npm',
                    installSpec: 'some-pkg',
                };
                MockResolveFrom.resolves((0, helpers_1.resolveFixture)('plugin-schema.js'));
                pluginConfig = PluginConfig.create(manifest);
            });
            describe('when the extension data is missing `schema`', function () {
                it('should throw', async function () {
                    delete extData.schema;
                    await expect(pluginConfig.readExtensionSchema(extName, extData)).to.be.rejectedWith(TypeError, /why is this function being called/i);
                });
            });
            describe('when the extension schema has already been registered', function () {
                describe('when the schema is identical (presumably the same extension)', function () {
                    it('should not throw', async function () {
                        await pluginConfig.readExtensionSchema(extName, extData);
                        await expect(pluginConfig.readExtensionSchema(extName, extData)).to.be.fulfilled;
                    });
                });
                describe('when the schema differs (presumably a different extension)', function () {
                    it('should throw', async function () {
                        await pluginConfig.readExtensionSchema(extName, extData);
                        MockResolveFrom.resolves((0, helpers_1.resolveFixture)('driver-schema.js'));
                        await expect(pluginConfig.readExtensionSchema(extName, extData)).to.be.rejectedWith(/conflicts with an existing schema/i);
                    });
                });
            });
            describe('when the extension schema has not yet been registered', function () {
                it('should resolve and load the extension schema file', async function () {
                    await pluginConfig.readExtensionSchema(extName, extData);
                    expect(MockResolveFrom.calledOnce).to.be.true;
                });
            });
        });
    });
});
//# sourceMappingURL=plugin-config.spec.js.map