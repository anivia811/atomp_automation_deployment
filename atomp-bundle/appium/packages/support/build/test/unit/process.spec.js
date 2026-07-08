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
const teenProcess = __importStar(require("teen_process"));
const sinon_1 = require("sinon");
const lib_1 = require("../../lib");
const asyncbox_1 = require("asyncbox");
const SubProcess = teenProcess.SubProcess;
describe('process', function () {
    let sandbox;
    before(function () {
        (0, chai_1.use)(chai_as_promised_1.default);
    });
    beforeEach(function () {
        sandbox = (0, sinon_1.createSandbox)();
    });
    afterEach(function () {
        sandbox.verify();
        sandbox.restore();
    });
    describe('getProcessIds', function () {
        let proc;
        before(async function () {
            if (lib_1.system.isWindows()) {
                return this.skip();
            }
            proc = new SubProcess('tail', ['-f', __filename]);
            await proc.start();
        });
        after(async function () {
            if (proc) {
                await proc.stop();
            }
        });
        it('should get return an array for existing process', async function () {
            const pids = await lib_1.process.getProcessIds('tail');
            (0, chai_1.expect)(pids).to.be.an.instanceof(Array);
        });
        it('should get process identifiers for existing process', async function () {
            const pids = await lib_1.process.getProcessIds('tail');
            (0, chai_1.expect)(pids.length).to.be.at.least(1);
        });
        it('should get an empty array when the process does not exist', async function () {
            const pids = await lib_1.process.getProcessIds('sadfgasdfasdf');
            (0, chai_1.expect)(pids).to.have.length(0);
        });
        it('should throw an error if pgrep fails', async function () {
            sandbox.stub(teenProcess, 'exec').get(() => sandbox.stub().throws({ message: 'Oops', code: 2 }));
            await (0, chai_1.expect)(lib_1.process.getProcessIds('tail')).to.eventually.be.rejectedWith(/Oops/);
        });
    });
    describe('killProcess', function () {
        let proc;
        before(function () {
            if (lib_1.system.isWindows()) {
                return this.skip();
            }
        });
        beforeEach(async function () {
            proc = new SubProcess('tail', ['-f', __filename]);
            await proc.start();
        });
        afterEach(async function () {
            if (proc.isRunning) {
                await proc.stop();
            }
        });
        it('should kill process that is running', async function () {
            (0, chai_1.expect)(proc.isRunning).to.be.true;
            await lib_1.process.killProcess('tail');
            await (0, asyncbox_1.retryInterval)(10, 100, async () => {
                (0, chai_1.expect)(proc.isRunning).to.be.false;
            });
        });
        it('should do nothing if the process does not exist', async function () {
            (0, chai_1.expect)(proc.isRunning).to.be.true;
            await lib_1.process.killProcess('asdfasdfasdf');
            await (0, chai_1.expect)((0, asyncbox_1.retryInterval)(10, 100, async () => {
                (0, chai_1.expect)(proc.isRunning).to.be.false;
            })).to.eventually.be.rejected;
        });
        it('should throw an error if pgrep fails', async function () {
            sandbox.stub(teenProcess, 'exec').get(() => sandbox.stub().throws({ message: 'Oops', code: 2 }));
            await (0, chai_1.expect)(lib_1.process.killProcess('tail')).to.eventually.be.rejectedWith(/Oops/);
        });
        it('should throw an error if pkill fails', async function () {
            const innerExecStub = sandbox.stub();
            innerExecStub.returns({ stdout: '42\n' });
            innerExecStub.throws({ message: 'Oops', code: 2 });
            sandbox.stub(teenProcess, 'exec').get(() => innerExecStub);
            await (0, chai_1.expect)(lib_1.process.killProcess('tail')).to.eventually.be.rejectedWith(/Oops/);
        });
    });
});
//# sourceMappingURL=process.spec.js.map