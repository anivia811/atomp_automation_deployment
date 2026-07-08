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
const sinon_1 = require("sinon");
const schema = __importStar(require("../../../lib/schema/schema"));
const helpers_1 = require("../../helpers");
const { expect } = chai_1.default;
chai_1.default.use(chai_as_promised_1.default);
describe('schema/format-errors', function () {
    let sandbox;
    let formatErrors;
    let betterAjvMock;
    before(async function () {
        await schema.finalizeSchema();
    });
    beforeEach(function () {
        sandbox = (0, sinon_1.createSandbox)();
        betterAjvMock = sandbox.stub().returns('');
        ({ formatErrors } = helpers_1.rewiremock.proxy(() => require('../../../lib/schema/format-errors'), {
            '@sidvind/better-ajv-errors': betterAjvMock,
        }));
    });
    afterEach(function () {
        sandbox.restore();
    });
    describe('formatErrors()', function () {
        /** Minimal placeholder; tests only assert wiring to better-ajv-errors, not real AJV shapes. */
        const oneError = [
            { keyword: 'test', instancePath: '', schemaPath: '#', params: {} },
        ];
        describe('when provided `errors` as an empty array', function () {
            it('should throw', function () {
                expect(() => formatErrors([])).to.throw(TypeError, 'Array of errors must be non-empty');
            });
        });
        describe('when provided `errors` as `undefined`', function () {
            it('should throw', function () {
                expect(() => formatErrors()).to.throw(TypeError, 'Array of errors must be non-empty');
            });
        });
        describe('when provided `errors` as a non-empty array', function () {
            it('should return a string', function () {
                expect(formatErrors(oneError)).to.be.a('string');
            });
        });
        describe('when `opts.pretty` is false', function () {
            it('should call `betterAjvErrors()` with non-CLI output format', function () {
                formatErrors(oneError, {}, { pretty: false });
                expect(betterAjvMock.calledWith(schema.getSchema(), {}, oneError, {
                    format: 'js',
                    json: undefined,
                })).to.be.true;
            });
        });
        describe('when `opts.json` is a string', function () {
            it('should call `betterAjvErrors()` with option `json: opts.json`', function () {
                formatErrors(oneError, {}, { json: '{"foo": "bar"}' });
                expect(betterAjvMock.calledWith(schema.getSchema(), {}, oneError, {
                    format: 'cli',
                    json: '{"foo": "bar"}',
                })).to.be.true;
            });
        });
    });
});
//# sourceMappingURL=format-errors.spec.js.map