"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../lib/utils");
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const sinon_1 = require("sinon");
const parser_1 = require("../../../lib/cli/parser");
const startup_config_1 = require("../../../lib/bootstrap/startup-config");
const constants_1 = require("../../../lib/constants");
const schema_1 = require("../../../lib/schema/schema");
const { expect } = chai_1.default;
chai_1.default.use(chai_as_promised_1.default);
describe('bootstrap/startup-config', function () {
    let sandbox;
    beforeEach(function () {
        sandbox = (0, sinon_1.createSandbox)();
    });
    afterEach(function () {
        sandbox.restore();
    });
    describe('showConfig()', function () {
        let log;
        let dir;
        beforeEach(function () {
            log = sandbox.spy(console, 'log');
            dir = sandbox.spy(console, 'dir');
        });
        describe('when a config file is present', function () {
            it('should dump the current Appium config', function () {
                (0, startup_config_1.showConfig)({ address: 'bar' }, {
                    config: {
                        // @ts-expect-error
                        server: { 'callback-address': 'quux' },
                    },
                }, { port: 1234 }, { allowCors: false });
                expect(log.calledWith('Appium Configuration\n')).to.be.true;
            });
            it('should skip empty objects', function () {
                (0, startup_config_1.showConfig)(
                // @ts-expect-error
                { foo: 'bar', cows: {}, pigs: [], sheep: 0, ducks: false }, { config: { server: { address: 'quux' } } }, { spam: 'food' }, {});
                expect(dir.calledWith({ foo: 'bar', sheep: 0, ducks: false })).to.be.true;
            });
        });
        describe('when a config file is not present', function () {
            it('should dump the current Appium config (sans config file contents)', function () {
                (0, startup_config_1.showConfig)(
                // @ts-expect-error
                { foo: 'bar', cows: {}, pigs: [], sheep: 0, ducks: false }, {}, { spam: 'food' }, {});
                expect(log.calledWith('\n(no configuration file loaded)')).to.be.true;
            });
        });
        describe('when no CLI arguments (other than --show-config) provided', function () {
            it('should not dump CLI args', function () {
                (0, startup_config_1.showConfig)({}, {}, {}, {});
                expect(log.calledWith('\n(no CLI parameters provided)')).to.be.true;
            });
        });
    });
    describe('getNonDefaultServerArgs()', function () {
        let args;
        describe('without extension schemas', function () {
            beforeEach(async function () {
                (0, schema_1.resetSchema)();
                await (0, parser_1.getParser)(true);
                args = (0, schema_1.getDefaultsForSchema)();
            });
            it('should show none if we have all the defaults', function () {
                const nonDefaultArgs = (0, startup_config_1.getNonDefaultServerArgs)(args);
                expect(nonDefaultArgs).to.be.empty;
            });
            it('should catch a non-default argument', function () {
                args.allowCors = true;
                const nonDefaultArgs = (0, startup_config_1.getNonDefaultServerArgs)(args);
                expect(nonDefaultArgs).to.eql({ allowCors: true });
            });
            describe('when arg is an array', function () {
                it('should return the arg as an array', function () {
                    args.usePlugins = ['all'];
                    expect((0, startup_config_1.getNonDefaultServerArgs)(args)).to.eql({ usePlugins: ['all'] });
                });
            });
        });
        describe('with extension schemas', function () {
            beforeEach(async function () {
                (0, schema_1.resetSchema)();
                await (0, schema_1.registerSchema)(constants_1.PLUGIN_TYPE, 'crypto-fiend', {
                    type: 'object',
                    properties: { elite: { type: 'boolean', default: true } },
                });
                await (0, schema_1.finalizeSchema)();
                await (0, parser_1.getParser)(true);
                args = (0, schema_1.getDefaultsForSchema)();
            });
            it('should take extension schemas into account', function () {
                const nonDefaultArgs = (0, startup_config_1.getNonDefaultServerArgs)(args);
                expect(nonDefaultArgs).to.be.empty;
            });
            it('should catch a non-default argument', function () {
                (0, utils_1.setPath)(args, 'plugin.crypto-fiend.elite', false);
                const nonDefaultArgs = (0, startup_config_1.getNonDefaultServerArgs)(args);
                const expected = {};
                (0, utils_1.setPath)(expected, 'plugin.crypto-fiend.elite', false);
                expect(nonDefaultArgs).to.eql(expected);
            });
        });
    });
});
//# sourceMappingURL=startup-config.spec.js.map