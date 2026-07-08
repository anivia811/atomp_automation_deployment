"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const helpers_1 = require("./helpers");
describe('test logger', function () {
    let writers;
    let log;
    before(function () {
        writers = (0, helpers_1.setupWriters)();
        log = (0, helpers_1.getDynamicLogger)(true, false);
    });
    after(function () {
        (0, helpers_1.restoreWriters)(writers);
    });
    it('should contains levels', function () {
        (0, chai_1.expect)(log.levels).to.have.length.above(3);
        (0, chai_1.expect)(log.levels[2]).to.equal('debug');
    });
    it('should unwrap', function () {
        (0, chai_1.expect)(log.unwrap).to.exist;
        (0, chai_1.expect)(log.unwrap()).to.exist;
    });
    it('should rewrite npmlog levels during testing', function () {
        const text = 'hi';
        log.silly(text);
        log.verbose(text);
        log.info(text);
        log.http(text);
        log.warn(text);
        log.error(text);
        (0, chai_1.expect)(() => {
            throw log.errorWithException(text);
        }).to.throw(text);
        (0, helpers_1.assertOutputDoesntContain)(writers, text);
    });
});
//# sourceMappingURL=logger-test.spec.js.map