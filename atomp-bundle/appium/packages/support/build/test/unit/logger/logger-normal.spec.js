"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const helpers_1 = require("./helpers");
const LOG_LEVELS = ['silly', 'verbose', 'info', 'http', 'warn', 'error'];
describe('normal logger', function () {
    let writers;
    let log;
    beforeEach(function () {
        writers = (0, helpers_1.setupWriters)();
        log = (0, helpers_1.getDynamicLogger)(false, false);
        log.level = 'silly';
    });
    afterEach(function () {
        (0, helpers_1.restoreWriters)(writers);
    });
    it('should not rewrite log levels outside of testing', function () {
        for (const levelName of LOG_LEVELS) {
            log[levelName](levelName);
            (0, helpers_1.assertOutputContains)(writers, levelName);
        }
    });
    it('throw should not rewrite log levels outside of testing and throw error', function () {
        (0, chai_1.expect)(() => {
            throw log.errorWithException('msg1');
        }).to.throw('msg1');
        (0, chai_1.expect)(() => {
            throw log.errorWithException(new Error('msg2'));
        }).to.throw('msg2');
        (0, helpers_1.assertOutputContains)(writers, 'msg1');
        (0, helpers_1.assertOutputContains)(writers, 'msg2');
    });
    it('should get and set log levels', function () {
        log.level = 'warn';
        (0, chai_1.expect)(log.level).to.equal('warn');
        log.info('information');
        log.warn('warning');
        (0, helpers_1.assertOutputDoesntContain)(writers, 'information');
        (0, helpers_1.assertOutputContains)(writers, 'warning');
    });
    it('should split lines of multi-line logs', function () {
        log.level = 'warn';
        log.warn('this is one line\nand this is another');
        (0, helpers_1.assertOutputDoesntContain)(writers, 'this is one line\nand this is another');
        (0, helpers_1.assertOutputContains)(writers, 'this is one line');
        (0, helpers_1.assertOutputContains)(writers, 'and this is another');
    });
    it('should split stack trace of Error', function () {
        log.level = 'warn';
        const error = new Error('this is an error');
        error.stack = 'stack line 1\nstack line 2';
        log.warn(error);
        (0, helpers_1.assertOutputDoesntContain)(writers, 'stack line 1\nstack line 2');
        (0, helpers_1.assertOutputContains)(writers, 'stack line 1');
        (0, helpers_1.assertOutputContains)(writers, 'stack line 2');
    });
});
describe('normal logger with static prefix', function () {
    let writers;
    let log;
    const PREFIX = 'my_static_prefix';
    before(function () {
        writers = (0, helpers_1.setupWriters)();
        log = (0, helpers_1.getDynamicLogger)(false, false, PREFIX);
        log.level = 'silly';
    });
    after(function () {
        (0, helpers_1.restoreWriters)(writers);
    });
    it('should not rewrite log levels outside of testing', function () {
        for (const levelName of LOG_LEVELS) {
            log[levelName](levelName);
            (0, helpers_1.assertOutputContains)(writers, levelName);
            (0, helpers_1.assertOutputContains)(writers, PREFIX);
        }
    });
    it('throw should not rewrite log levels outside of testing and throw error', function () {
        (0, chai_1.expect)(() => {
            throw log.errorWithException('msg');
        }).to.throw('msg');
        (0, helpers_1.assertOutputContains)(writers, 'error');
        (0, helpers_1.assertOutputContains)(writers, PREFIX);
    });
});
describe('normal logger with dynamic prefix', function () {
    let writers;
    let log;
    const PREFIX = 'my_dynamic_prefix';
    before(function () {
        writers = (0, helpers_1.setupWriters)();
        log = (0, helpers_1.getDynamicLogger)(false, false, () => PREFIX);
        log.level = 'silly';
    });
    after(function () {
        (0, helpers_1.restoreWriters)(writers);
    });
    it('should not rewrite log levels outside of testing', function () {
        for (const levelName of LOG_LEVELS) {
            log[levelName](levelName);
            (0, helpers_1.assertOutputContains)(writers, levelName);
            (0, helpers_1.assertOutputContains)(writers, PREFIX);
        }
    });
    it('throw should not rewrite log levels outside of testing and throw error', function () {
        (0, chai_1.expect)(() => {
            throw log.errorWithException('msg');
        }).to.throw('msg');
        (0, helpers_1.assertOutputContains)(writers, 'error');
        (0, helpers_1.assertOutputContains)(writers, PREFIX);
    });
});
//# sourceMappingURL=logger-normal.spec.js.map