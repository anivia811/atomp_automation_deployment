"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const node_fs_1 = __importDefault(require("node:fs"));
const sinon_1 = require("sinon");
const YAML = __importStar(require("yaml"));
const schema = __importStar(require("../../../lib/schema/schema"));
const helpers_1 = require("../../helpers");
const { expect } = chai_1.default;
chai_1.default.use(chai_as_promised_1.default);
describe('bootstrap/config-file', function () {
    const GOOD_YAML_CONFIG_FILEPATH = (0, helpers_1.resolveFixture)('config', 'appium-config-good.yaml');
    const GOOD_JSON_CONFIG_FILEPATH = (0, helpers_1.resolveFixture)('config', 'appium-config-good.json');
    const GOOD_JS_CONFIG_FILEPATH = (0, helpers_1.resolveFixture)('config', 'appium-config-good.ts');
    const GOOD_YAML_CONFIG = YAML.parse(node_fs_1.default.readFileSync(GOOD_YAML_CONFIG_FILEPATH, 'utf8'));
    const GOOD_JSON_CONFIG = require(GOOD_JSON_CONFIG_FILEPATH);
    const BAD_JSON_CONFIG_FILEPATH = (0, helpers_1.resolveFixture)('config', 'appium-config-bad.json');
    const BAD_JSON_CONFIG = require(BAD_JSON_CONFIG_FILEPATH);
    let sandbox;
    let readConfigFile;
    let normalizeConfig;
    let lc;
    let validateSpy;
    before(async function () {
        // generally called via the CLI parser, this needs to be done manually in tests.
        // we don't need to do this before _each_ test, because we're not changing the schema.
        // if we did change the schema, this would need to be in `beforeEach()` and `afterEach()`
        // would need to call `schema.reset()`.
        await schema.finalizeSchema();
    });
    beforeEach(function () {
        sandbox = (0, sinon_1.createSandbox)();
        // we have to manually type this (and `search()`) because we'd only get the real type
        // when stubbing an object prop; e.g., `stub(lilconfig, 'load')`
        const load = sandbox.stub().resolves({
            config: GOOD_JSON_CONFIG,
            filepath: GOOD_JSON_CONFIG_FILEPATH,
        });
        load.withArgs(GOOD_YAML_CONFIG_FILEPATH).resolves({
            config: GOOD_YAML_CONFIG,
            filepath: GOOD_YAML_CONFIG_FILEPATH,
        });
        load.withArgs(BAD_JSON_CONFIG_FILEPATH).resolves({
            config: BAD_JSON_CONFIG,
            filepath: BAD_JSON_CONFIG_FILEPATH,
        });
        const search = sandbox.stub().resolves({
            config: GOOD_JSON_CONFIG,
            filepath: GOOD_JSON_CONFIG_FILEPATH,
        });
        lc = {
            load,
            search,
        };
        const mocks = {
            lilconfig: {
                lilconfig: sandbox.stub().returns(lc),
            },
            '@sidvind/better-ajv-errors': sandbox.stub().returns(''),
        };
        // loads the `config-file` module using the lilconfig mock.
        // we only mock lilconfig because it'd otherwise be a pain in the rear to test
        // searching for config files, and it increases the likelihood that we'd load the wrong file.
        ({ readConfigFile, normalizeConfig } = helpers_1.rewiremock.proxy(() => require('../../../lib/bootstrap/config-file'), mocks));
        // just want to be extra-sure `validate()` happens
        sandbox.spy(schema, 'validate');
        validateSpy = schema.validate;
    });
    afterEach(function () {
        sandbox.restore();
    });
    describe('readConfigFile()', function () {
        let result;
        it('should support yaml', async function () {
            const { config } = await readConfigFile(GOOD_YAML_CONFIG_FILEPATH);
            expect(config).to.eql(normalizeConfig(GOOD_JSON_CONFIG));
            expect(validateSpy.calledOnce).to.be.true;
        });
        it('should support json', async function () {
            const { config } = await readConfigFile(GOOD_JSON_CONFIG_FILEPATH);
            expect(config).to.eql(normalizeConfig(GOOD_JSON_CONFIG));
            expect(validateSpy.calledOnce).to.be.true;
        });
        it('should support js', async function () {
            const { config } = await readConfigFile(GOOD_JS_CONFIG_FILEPATH);
            expect(config).to.eql(normalizeConfig(GOOD_JSON_CONFIG));
            expect(validateSpy.calledOnce).to.be.true;
        });
        describe('when no filepath provided', function () {
            beforeEach(async function () {
                result = await readConfigFile();
            });
            it('should search for a config file', function () {
                expect(lc.search.calledOnce).to.be.true;
                expect(validateSpy.calledOnce).to.be.true;
            });
            it('should not try to load a config file directly', function () {
                expect(lc.load.called).to.be.false;
            });
            describe('when no config file is found', function () {
                beforeEach(async function () {
                    lc.search.resolves();
                    validateSpy.resetHistory();
                    result = await readConfigFile();
                });
                it('should resolve with an empty object', function () {
                    expect(result).to.be.an('object').that.is.empty;
                    expect(validateSpy.calledOnce).to.be.false;
                });
            });
            describe('when a config file is found', function () {
                describe('when the config file is empty', function () {
                    beforeEach(async function () {
                        lc.search.resolves({
                            isEmpty: true,
                            filepath: '/path/to/file.json',
                            config: {},
                        });
                        result = await readConfigFile();
                    });
                    it('should resolve with an object with an `isEmpty` property', function () {
                        expect(result).to.have.property('isEmpty', true);
                    });
                });
                describe('when the config file is not empty', function () {
                    it('should validate the config against a schema', function () {
                        expect(validateSpy.calledOnceWith(GOOD_JSON_CONFIG)).to.be.true;
                    });
                    describe('when the config file is valid', function () {
                        beforeEach(async function () {
                            result = await readConfigFile();
                        });
                        it('should resolve with an object having `config` property and empty array of errors', function () {
                            expect(result).to.deep.equal({
                                config: normalizeConfig(GOOD_JSON_CONFIG),
                                errors: [],
                                filepath: GOOD_JSON_CONFIG_FILEPATH,
                            });
                        });
                    });
                    describe('when the config file is invalid', function () {
                        beforeEach(async function () {
                            lc.search.resolves({
                                config: { foo: 'bar' },
                                filepath: '/path/to/file.json',
                            });
                            result = await readConfigFile();
                        });
                        it('should resolve with an object having a nonempty array of errors', function () {
                            expect(result).to.have.property('errors').that.is.not.empty;
                        });
                    });
                });
            });
        });
        describe('when filepath provided', function () {
            beforeEach(async function () {
                result = await readConfigFile('appium.json');
            });
            it('should not attempt to find a config file', function () {
                expect(lc.search.called).to.be.false;
            });
            it('should try to load a config file directly', function () {
                expect(lc.load.calledOnce).to.be.true;
            });
            describe('when no config file exists at path', function () {
                beforeEach(function () {
                    lc.load.rejects(Object.assign(new Error(), { code: 'ENOENT' }));
                });
                it('should reject with user-friendly message', async function () {
                    await expect(readConfigFile('appium.json')).to.be.rejectedWith(/not found at user-provided path/);
                });
            });
            describe('when the config file is invalid JSON', function () {
                beforeEach(function () {
                    lc.load.rejects(new SyntaxError());
                });
                it('should reject with user-friendly message', async function () {
                    await expect(readConfigFile('appium.json')).to.be.rejectedWith(/Config file at user-provided path appium.json is invalid/);
                });
            });
            describe('when something else is wrong with loading the config file', function () {
                beforeEach(function () {
                    lc.load.rejects(new Error('guru meditation'));
                });
                it('should pass error through', async function () {
                    await expect(readConfigFile('appium.json')).to.be.rejectedWith(/guru meditation/);
                });
            });
            describe('when a config file is found', function () {
                describe('when the config file is empty', function () {
                    beforeEach(async function () {
                        lc.search.resolves({
                            isEmpty: true,
                            filepath: '/path/to/file.json',
                            config: {},
                        });
                        result = await readConfigFile();
                    });
                    it('should resolve with an object with an `isEmpty` property', function () {
                        expect(result).to.have.property('isEmpty', true);
                    });
                });
                describe('when the config file is not empty', function () {
                    it('should validate the config against a schema', function () {
                        expect(validateSpy.calledOnceWith(GOOD_JSON_CONFIG)).to.be.true;
                    });
                    describe('when the config file is valid', function () {
                        beforeEach(async function () {
                            result = await readConfigFile();
                        });
                        it('should resolve with an object having `config` property and empty array of errors', function () {
                            expect(result).to.deep.equal({
                                errors: [],
                                config: normalizeConfig(GOOD_JSON_CONFIG),
                                filepath: GOOD_JSON_CONFIG_FILEPATH,
                            });
                        });
                    });
                    describe('when the config file is invalid', function () {
                        beforeEach(async function () {
                            result = await readConfigFile(BAD_JSON_CONFIG_FILEPATH);
                        });
                        it('should resolve with an object having a nonempty array of errors', function () {
                            expect(result).to.have.property('errors').that.is.not.empty;
                        });
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=config-file.spec.js.map