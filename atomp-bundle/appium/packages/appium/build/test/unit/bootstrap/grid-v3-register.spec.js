"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const sinon_1 = require("sinon");
const helpers_1 = require("../../helpers");
/** Mimics `@appium/support` logger so `throw logger.errorWithException(msg)` throws a real `Error`. */
function createStubAppiumLogger(sandbox) {
    return {
        error: sandbox.stub(),
        warn: sandbox.stub(),
        debug: sandbox.stub(),
        info: sandbox.stub(),
        errorWithException: sandbox.stub().callsFake((...args) => {
            const first = args[0];
            if (first instanceof Error) {
                return first;
            }
            return new Error(args.map(String).join('\n'));
        }),
    };
}
describe('bootstrap/grid-v3-register', function () {
    let sandbox;
    before(async function () {
        (0, chai_1.use)(chai_as_promised_1.default);
    });
    beforeEach(function () {
        sandbox = (0, sinon_1.createSandbox)();
    });
    afterEach(function () {
        sandbox.restore();
    });
    describe('registerNode()', function () {
        let registerNode;
        let mocks;
        let stubLog;
        beforeEach(function () {
            stubLog = createStubAppiumLogger(sandbox);
            mocks = {
                '@appium/support': {
                    fs: {
                        readFile: sandbox.stub().resolves('{}'),
                    },
                    logger: {
                        getLogger: sandbox.stub().returns(stubLog),
                    },
                },
                axios: sandbox.stub().resolves({ data: '', status: 200 }),
            };
            ({ default: registerNode } = helpers_1.rewiremock.proxy(() => require('../../../lib/bootstrap/grid-v3-register'), mocks));
        });
        describe('when provided a path to a config file', function () {
            const binding = { addr: '127.0.0.1', port: 4723, basePath: '' };
            it('should read the config file', async function () {
                await registerNode('/path/to/config-file.json', binding.addr, binding.port, binding.basePath);
                (0, chai_1.expect)(mocks['@appium/support'].fs.readFile.calledOnceWith('/path/to/config-file.json', 'utf-8')).to.be.true;
            });
            it('should parse the config file as JSON', async function () {
                const parseSpy = sandbox.spy(JSON, 'parse');
                await registerNode('/path/to/config-file.json', binding.addr, binding.port, binding.basePath);
                (0, chai_1.expect)(parseSpy.calledOnceWith(await mocks['@appium/support'].fs.readFile.firstCall.returnValue)).to.be.true;
            });
            describe('when the config file is invalid', function () {
                beforeEach(function () {
                    mocks['@appium/support'].fs.readFile.resolves('');
                });
                it('should reject with a JSON parse error from the config file', async function () {
                    await (0, chai_1.expect)(registerNode('/path/to/config-file.json', binding.addr, binding.port, binding.basePath)).to.be.rejectedWith(Error, /Syntax error in Selenium Grid 3 node configuration file/);
                    (0, chai_1.expect)(stubLog.errorWithException.calledOnce).to.be.true;
                });
            });
            describe('when address, port, or basePath are omitted', function () {
                it('should reject when addr is missing', async function () {
                    await (0, chai_1.expect)(registerNode('/path/to/config-file.json', undefined, 4723, '')).to.be.rejectedWith(Error, /address, port, and basePath are required \(e\.g\. match your Appium `--address`/);
                    (0, chai_1.expect)(stubLog.errorWithException.calledOnce).to.be.true;
                });
                it('should reject when port is missing', async function () {
                    await (0, chai_1.expect)(registerNode('/path/to/config-file.json', '127.0.0.1', undefined, '')).to.be.rejectedWith(Error, /address, port, and basePath are required \(e\.g\. match your Appium `--address`/);
                    (0, chai_1.expect)(stubLog.errorWithException.calledOnce).to.be.true;
                });
                it('should reject when basePath is missing', async function () {
                    await (0, chai_1.expect)(registerNode('/path/to/config-file.json', '127.0.0.1', 4723, undefined)).to.be.rejectedWith(Error, /address, port, and basePath are required \(e\.g\. match your Appium `--address`/);
                    (0, chai_1.expect)(stubLog.errorWithException.calledOnce).to.be.true;
                });
                it('should reject when port is not a finite number', async function () {
                    await (0, chai_1.expect)(registerNode('/path/to/config-file.json', '127.0.0.1', Number.NaN, '')).to.be.rejectedWith(Error, /port must be a finite number/);
                    (0, chai_1.expect)(stubLog.errorWithException.calledOnce).to.be.true;
                });
            });
        });
        describe('when provided a config object', function () {
            it('should not attempt to read the object as a config file', async function () {
                await registerNode({ my: 'config' });
                (0, chai_1.expect)(mocks['@appium/support'].fs.readFile.called).to.be.false;
            });
            it('should not attempt to parse any JSON', async function () {
                const parseSpy = sandbox.spy(JSON, 'parse');
                await registerNode({ my: 'config' });
                (0, chai_1.expect)(parseSpy.called).to.be.false;
            });
            it('should not hoist inherited properties into configuration', async function () {
                const clock = sandbox.useFakeTimers();
                const config = Object.create({
                    hubHost: 'evil.example.com',
                    hubPort: 4444,
                    hubProtocol: 'http',
                });
                config.capabilities = [];
                config.register = true;
                config.registerCycle = 100;
                await registerNode(config, '127.0.0.1', 4723, '');
                await clock.tickAsync(100);
                (0, chai_1.expect)(mocks.axios.calledOnce).to.be.true;
                const hubCfg = mocks.axios.firstCall.args[0].data.configuration;
                (0, chai_1.expect)(hubCfg).to.not.have.property('hubHost', 'evil.example.com');
                (0, chai_1.expect)(hubCfg.url).to.equal('http://127.0.0.1:4723');
            });
        });
    });
});
//# sourceMappingURL=grid-v3-register.spec.js.map