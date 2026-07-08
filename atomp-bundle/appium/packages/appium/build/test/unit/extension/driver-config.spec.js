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
describe('DriverConfig', function () {
    let yamlFixture;
    let manifest;
    let sandbox;
    let MockAppiumSupport;
    let MockResolveFrom;
    let DriverConfig;
    before(async function () {
        yamlFixture = await node_fs_1.promises.readFile((0, helpers_1.resolveFixture)('manifest', 'v3.yaml'), 'utf8');
    });
    beforeEach(function () {
        manifest = manifest_1.Manifest.getInstance('/somewhere/');
        let overrides;
        ({ MockAppiumSupport, MockResolveFrom, overrides, sandbox } = (0, mocks_1.initMocks)());
        MockAppiumSupport.fs.readFile.resolves(yamlFixture);
        ({ DriverConfig } = helpers_1.rewiremock.proxy(() => require('../../../lib/extension/driver-config'), overrides));
        (0, schema_1.resetSchema)();
    });
    afterEach(function () {
        sandbox.restore();
    });
    describe('class method', function () {
        describe('create()', function () {
            describe('when the DriverConfig is not yet associated with a Manifest', function () {
                it('should return a new DriverConfig', function () {
                    const config = DriverConfig.create(manifest);
                    expect(config).to.be.an.instanceof(DriverConfig);
                });
                it('should be associated with the Manifest', function () {
                    const config = DriverConfig.create(manifest);
                    expect(config.manifest).to.equal(manifest);
                });
            });
            describe('when the DriverConfig is associated with a Manifest', function () {
                beforeEach(function () {
                    DriverConfig.create(manifest);
                });
                it('should throw', function () {
                    expect(() => DriverConfig.create(manifest)).to.throw(Error, new RegExp(`Manifest with APPIUM_HOME ${manifest.appiumHome} already has a DriverConfig`, 'i'));
                });
            });
        });
        describe('getInstance()', function () {
            describe('when the Manifest is not yet associated with a DriverConfig', function () {
                it('should return undefined', function () {
                    expect(DriverConfig.getInstance(manifest)).to.be.undefined;
                });
            });
            describe('when the Manifest is associated with a DriverConfig', function () {
                let driverConfig;
                beforeEach(function () {
                    driverConfig = DriverConfig.create(manifest);
                });
                it('should return the associated DriverConfig instance', function () {
                    expect(DriverConfig.getInstance(manifest)).to.equal(driverConfig);
                });
            });
        });
    });
    describe('instance method', function () {
        describe('extensionDesc()', function () {
            it('should return the description of the extension', function () {
                const config = DriverConfig.create(manifest);
                expect(config.extensionDesc('foo', { version: '1.0', automationName: 'bar' })).to.equal(`foo@1.0 (automationName 'bar')`);
            });
        });
        describe('getConfigProblems()', function () {
            let driverConfig;
            beforeEach(function () {
                driverConfig = DriverConfig.create(manifest);
            });
            describe('when provided no arguments', function () {
                it('should throw', function () {
                    expect(() => driverConfig.getConfigProblems()).to.throw();
                });
            });
            describe('property `platformNames`', function () {
                describe('when provided an object with no `platformNames` property', function () {
                    it('should return an array having an associated problem', function () {
                        expect(driverConfig.getConfigProblems({})).to.deep.include({
                            err: 'Missing or incorrect supported platformNames list.',
                            val: undefined,
                        });
                    });
                });
                describe('when provided an object with an empty `platformNames` property', function () {
                    it('should return an array having an associated problem', function () {
                        expect(driverConfig.getConfigProblems({ platformNames: [] })).to.deep.include({
                            err: 'Empty platformNames list.',
                            val: [],
                        });
                    });
                });
                describe('when provided an object with a non-array `platformNames` property', function () {
                    it('should return an array having an associated problem', function () {
                        expect(driverConfig.getConfigProblems({ platformNames: 'foo' })).to.deep.include({
                            err: 'Missing or incorrect supported platformNames list.',
                            val: 'foo',
                        });
                    });
                });
                describe('when provided a non-empty array containing a non-string item', function () {
                    it('should return an array having an associated problem', function () {
                        expect(driverConfig.getConfigProblems({ platformNames: ['a', 1] })).to.deep.include({
                            err: 'Incorrectly formatted platformName.',
                            val: 1,
                        });
                    });
                });
            });
            describe('property `automationName`', function () {
                describe('when provided an object with a missing `automationName` property', function () {
                    it('should return an array having an associated problem', function () {
                        expect(driverConfig.getConfigProblems({})).to.deep.include({
                            err: 'Missing or incorrect automationName',
                            val: undefined,
                        });
                    });
                });
                describe('when provided a conflicting automationName', function () {
                    it('should return an array having an associated problem', function () {
                        driverConfig.getConfigProblems({ automationName: 'foo' });
                        expect(driverConfig.getConfigProblems({ automationName: 'foo' })).to.deep.include({
                            err: 'Multiple drivers claim support for the same automationName',
                            val: 'foo',
                        });
                    });
                });
            });
        });
        describe('getSchemaProblems()', function () {
            let driverConfig;
            beforeEach(function () {
                driverConfig = DriverConfig.create(manifest);
            });
            describe('when provided an object with a defined non-string `schema` property', function () {
                it('should return an array having an associated problem', async function () {
                    expect(await driverConfig.getSchemaProblems({ schema: [] })).to.deep.include({
                        err: 'Incorrectly formatted schema field; must be a path to a schema file or a schema object.',
                        val: [],
                    });
                });
            });
            describe('when provided a string `schema` property', function () {
                describe('when the property ends in an unsupported extension', function () {
                    it('should return an array having an associated problem', async function () {
                        expect(await driverConfig.getSchemaProblems({ schema: 'selenium.java' })).to.deep.include({
                            err: 'Schema file has unsupported extension. Allowed: .json, .js, .cjs',
                            val: 'selenium.java',
                        });
                    });
                });
                describe('when the property contains a supported extension', function () {
                    describe('when the property as a path cannot be found', function () {
                        it('should return an array having an associated problem', async function () {
                            const problems = await driverConfig.getSchemaProblems({
                                pkgName: 'doop',
                                schema: 'herp.json',
                            }, 'foo');
                            expect(problems)
                                .with.nested.property('[0].err')
                                .to.match(/Unable to register schema at path herp\.json/i);
                        });
                    });
                    describe('when the property as a path is found', function () {
                        beforeEach(function () {
                            MockResolveFrom.resolves((0, helpers_1.resolveFixture)('driver-schema.js'));
                        });
                        it('should return an empty array', async function () {
                            await expect(driverConfig.getSchemaProblems({
                                pkgName: 'whatever',
                                schema: 'driver-schema.js',
                            }, 'foo')).to.eventually.be.empty;
                        });
                    });
                });
            });
        });
        describe('readExtensionSchema()', function () {
            let driverConfig;
            let extData;
            const extName = 'stuff';
            beforeEach(function () {
                extData = {
                    pkgName: 'some-pkg',
                    schema: 'driver-schema.js',
                    automationName: 'foo',
                    mainClass: 'Gargle',
                    platformNames: ['barnyard'],
                    version: '1.0.0',
                    installSpec: 'some-pkg',
                    installType: 'npm',
                    installPath: '/somewhere',
                };
                MockResolveFrom.resolves((0, helpers_1.resolveFixture)('driver-schema.js'));
                driverConfig = DriverConfig.create(manifest);
            });
            describe('when the extension data is missing `schema`', function () {
                it('should throw', async function () {
                    delete extData.schema;
                    await expect(driverConfig.readExtensionSchema(extName, extData)).to.be.rejectedWith(TypeError, /why is this function being called/i);
                });
            });
            describe('when the extension schema has already been registered (with the same schema)', function () {
                it('should not throw', async function () {
                    await driverConfig.readExtensionSchema(extName, extData);
                    await expect(driverConfig.readExtensionSchema(extName, extData)).to.be.fulfilled;
                });
            });
            describe('when the extension schema has not yet been registered', function () {
                it('should resolve and load the extension schema file', async function () {
                    await driverConfig.readExtensionSchema(extName, extData);
                    // we don't have access to the schema registration cache directly, so this is as close as we can get.
                    expect(MockResolveFrom.calledOnce).to.be.true;
                });
            });
        });
    });
});
//# sourceMappingURL=driver-config.spec.js.map