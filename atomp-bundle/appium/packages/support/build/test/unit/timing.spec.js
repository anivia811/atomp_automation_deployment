"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const sinon_1 = require("sinon");
const lib_1 = require("../../lib");
describe('timing', function () {
    let processMock;
    let sandbox;
    before(function () {
        (0, chai_1.use)(chai_as_promised_1.default);
    });
    beforeEach(function () {
        sandbox = (0, sinon_1.createSandbox)();
    });
    afterEach(function () {
        if (processMock) {
            processMock.verify();
        }
        sandbox.restore();
    });
    describe('bigint', function () {
        beforeEach(function () {
            if (typeof process.hrtime.bigint !== 'function') {
                return this.skip();
            }
            processMock = sandbox.mock(process.hrtime);
        });
        function setupMocks(once = false) {
            if (once) {
                processMock.expects('bigint').once().onFirstCall().returns(BigInt(1172941153404030));
            }
            else {
                processMock
                    .expects('bigint')
                    .twice()
                    .onFirstCall()
                    .returns(BigInt(1172941153404030))
                    .onSecondCall()
                    .returns(BigInt(1172951164887132));
            }
        }
        it('should get a duration', function () {
            setupMocks();
            const timer = new lib_1.timing.Timer().start();
            const duration = timer.getDuration();
            (0, chai_1.expect)(duration.nanos).to.be.a('number');
        });
        it('should get correct seconds', function () {
            setupMocks();
            const timer = new lib_1.timing.Timer().start();
            const duration = timer.getDuration();
            (0, chai_1.expect)(duration.asSeconds).to.eql(10.011483102);
        });
        it('should get correct milliseconds', function () {
            setupMocks();
            const timer = new lib_1.timing.Timer().start();
            const duration = timer.getDuration();
            (0, chai_1.expect)(duration.asMilliSeconds).to.eql(10011.483102);
        });
        it('should get correct nanoseconds', function () {
            setupMocks();
            const timer = new lib_1.timing.Timer().start();
            const duration = timer.getDuration();
            (0, chai_1.expect)(duration.asNanoSeconds).to.eql(10011483102);
        });
        it('should error if the timer was not started', function () {
            const timer = new lib_1.timing.Timer();
            (0, chai_1.expect)(() => timer.getDuration()).to.throw('Unable to get duration');
        });
        it('should error if passing in a non-bigint', function () {
            const timer = new lib_1.timing.Timer();
            timer._startTime = 12345;
            (0, chai_1.expect)(() => timer.getDuration()).to.throw('Unable to get duration');
        });
    });
});
//# sourceMappingURL=timing.spec.js.map