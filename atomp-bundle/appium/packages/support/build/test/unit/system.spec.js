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
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const lib_1 = require("../../lib");
const node_os_1 = __importDefault(require("node:os"));
const sinon_1 = require("sinon");
const teen_process = __importStar(require("teen_process"));
const SANDBOX = Symbol();
const libs = { os: node_os_1.default, system: lib_1.system };
describe('system', function () {
    let sandbox;
    let osMock;
    let mocks;
    before(function () {
        (0, chai_1.use)(chai_as_promised_1.default);
    });
    beforeEach(function () {
        sandbox = (0, sinon_1.createSandbox)();
        mocks = {};
    });
    afterEach(function () {
        sandbox.verify();
        sandbox.restore();
    });
    describe('isX functions', function () {
        beforeEach(function () {
            osMock = sandbox.mock(node_os_1.default);
        });
        afterEach(function () {
            osMock.verify();
        });
        it('should correctly return Windows System if it is a Windows', function () {
            osMock.expects('type').returns('Windows_NT');
            (0, chai_1.expect)(lib_1.system.isWindows()).to.be.true;
        });
        it('should correctly return Mac if it is a Mac', function () {
            osMock.expects('type').returns('Darwin');
            (0, chai_1.expect)(lib_1.system.isMac()).to.be.true;
        });
        it('should correctly return Linux if it is a Linux', function () {
            osMock.expects('type').twice().returns('Linux');
            (0, chai_1.expect)(lib_1.system.isLinux()).to.be.true;
        });
    });
    describe('mac OSX version', function () {
        it('should return correct version for 10.10.5', async function () {
            sandbox.stub(teen_process, 'exec').get(() => sandbox.stub().withArgs('sw_vers', ['-productVersion']).returns({ stdout: '10.10.5' }));
            await (0, chai_1.expect)(lib_1.system.macOsxVersion()).to.eventually.equal('10.10');
        });
        it('should return correct version for 10.12', async function () {
            sandbox.stub(teen_process, 'exec').get(() => sandbox.stub().withArgs('sw_vers', ['-productVersion']).returns({ stdout: '10.12.0' }));
            await (0, chai_1.expect)(lib_1.system.macOsxVersion()).to.eventually.equal('10.12');
        });
        it('should return correct version for 10.12 with newline', async function () {
            sandbox.stub(teen_process, 'exec').get(() => sandbox.stub().withArgs('sw_vers', ['-productVersion']).returns({ stdout: '10.12   \n' }));
            await (0, chai_1.expect)(lib_1.system.macOsxVersion()).to.eventually.equal('10.12');
        });
        it("should throw an error if OSX version can't be determined", async function () {
            const invalidOsx = 'error getting operation system version blabla';
            sandbox.stub(teen_process, 'exec').get(() => sandbox.stub().withArgs('sw_vers', ['-productVersion']).returns({ stdout: invalidOsx }));
            await (0, chai_1.expect)(lib_1.system.macOsxVersion()).to.eventually.be.rejectedWith(new RegExp(lib_1.util.escapeRegExp(invalidOsx)));
        });
    });
    describe('architecture', function () {
        beforeEach(function () {
            mocks[SANDBOX] = sandbox;
            for (const [key, value] of Object.entries(libs)) {
                mocks[key] = sandbox.mock(value);
            }
        });
        afterEach(function () {
            sandbox.restore();
        });
        it('should return correct architecture if it is a 64 bit Mac/Linux', async function () {
            mocks.os.expects('type').thrice().returns('Darwin');
            sandbox.stub(teen_process, 'exec').get(() => sandbox.stub().withArgs('uname', ['-m']).returns({ stdout: 'x86_64' }));
            const arch = await lib_1.system.arch();
            (0, chai_1.expect)(arch).to.equal('64');
            mocks[SANDBOX].verify();
        });
        it('should return correct architecture if it is a 32 bit Mac/Linux', async function () {
            mocks.os.expects('type').twice().returns('Linux');
            sandbox.stub(teen_process, 'exec').get(() => sandbox.stub().withArgs('uname', ['-m']).returns({ stdout: 'i686' }));
            const arch = await lib_1.system.arch();
            (0, chai_1.expect)(arch).to.equal('32');
            mocks[SANDBOX].verify();
        });
        it('should return correct architecture if it is a 64 bit Windows', async function () {
            mocks.os.expects('type').thrice().returns('Windows_NT');
            mocks.system.expects('isOSWin64').once().returns(true);
            const arch = await lib_1.system.arch();
            (0, chai_1.expect)(arch).to.equal('64');
            mocks[SANDBOX].verify();
        });
        it('should return correct architecture if it is a 32 bit Windows', async function () {
            mocks.os.expects('type').thrice().returns('Windows_NT');
            mocks.system.expects('isOSWin64').once().returns(false);
            const arch = await lib_1.system.arch();
            (0, chai_1.expect)(arch).to.equal('32');
            mocks[SANDBOX].verify();
        });
    });
    it('should know architecture', function () {
        return lib_1.system.arch();
    });
});
//# sourceMappingURL=system.spec.js.map