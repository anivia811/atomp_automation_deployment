"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const helpers_1 = require("./helpers");
describe('logger with force log', function () {
    let writers;
    let log;
    before(function () {
        writers = (0, helpers_1.setupWriters)();
        log = (0, helpers_1.getDynamicLogger)(true, true);
        log.level = 'silly';
    });
    after(function () {
        (0, helpers_1.restoreWriters)(writers);
    });
    it('should not rewrite log levels even during testing', function () {
        log.silly('silly');
        (0, helpers_1.assertOutputContains)(writers, 'silly');
        log.verbose('verbose');
        (0, helpers_1.assertOutputContains)(writers, 'verbose');
        log.verbose('debug');
        (0, helpers_1.assertOutputContains)(writers, 'debug');
        log.info('info');
        (0, helpers_1.assertOutputContains)(writers, 'info');
        log.http('http');
        (0, helpers_1.assertOutputContains)(writers, 'http');
        log.warn('warn');
        (0, helpers_1.assertOutputContains)(writers, 'warn');
        log.error('error');
        (0, helpers_1.assertOutputContains)(writers, 'error');
        (0, chai_1.expect)(() => {
            throw log.errorWithException('msg');
        }).to.throw('msg');
        (0, helpers_1.assertOutputContains)(writers, 'error');
        (0, helpers_1.assertOutputContains)(writers, 'msg');
    });
});
//# sourceMappingURL=logger-force.spec.js.map