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
const utils_1 = require("../../lib/utils");
const chai = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
chai.use(chai_as_promised_1.default);
const { expect } = chai;
describe('argify', function () {
    it('should create args from params', function () {
        // deploy example
        const version = '2.0';
        const mikeOpts = {
            'config-file': '/path/to/yml',
            push: true,
            remote: 'origin',
            branch: 'gh-pages',
            'deploy-prefix': '2.0',
            message: 'docs: a thing',
            port: 8100,
            host: 'localhost',
        };
        const mikeArgs = [
            ...(0, utils_1.argify)(Object.fromEntries(Object.entries(mikeOpts).filter(([key, value]) => !['port', 'host'].includes(key) && (typeof value === 'number' || Boolean(value))))),
            version,
        ];
        expect(mikeArgs).to.eql([
            '--config-file',
            '/path/to/yml',
            '--push',
            '--remote',
            'origin',
            '--branch',
            'gh-pages',
            '--deploy-prefix',
            '2.0',
            '--message',
            'docs: a thing',
            '2.0',
        ]);
    });
});
//# sourceMappingURL=util.spec.js.map