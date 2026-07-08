"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const utils_1 = require("../../lib/utils");
describe('utils', function () {
    describe('ansiColor', function () {
        it('should encode a single foreground color', function () {
            (0, chai_1.expect)((0, utils_1.ansiColor)('red')).to.eql('\x1b[31m');
        });
        it('should encode multiple styles', function () {
            (0, chai_1.expect)((0, utils_1.ansiColor)('cyan', 'bgBlack', 'bold')).to.eql('\x1b[36;40;1m');
        });
        it('should encode reset', function () {
            (0, chai_1.expect)((0, utils_1.ansiColor)('reset')).to.eql('\x1b[0m');
        });
        it('should throw for unknown style names', function () {
            (0, chai_1.expect)(() => (0, utils_1.ansiColor)('not-a-style')).to.throw('Unknown color or style name: not-a-style');
        });
    });
    describe('ansiBeep', function () {
        it('should return the bell character', function () {
            (0, chai_1.expect)((0, utils_1.ansiBeep)()).to.eql('\x07');
        });
    });
    describe('setBlocking', function () {
        function createTTYStream() {
            const handle = {
                last: undefined,
                setBlocking(value) {
                    this.last = value;
                },
            };
            return {
                isTTY: true,
                _handle: handle,
            };
        }
        it('should set blocking on TTY streams with setBlocking handles', function () {
            const stdout = createTTYStream();
            const stderr = createTTYStream();
            (0, utils_1.setBlocking)(true, [stdout, stderr]);
            (0, chai_1.expect)(stdout._handle.last).to.be.true;
            (0, chai_1.expect)(stderr._handle.last).to.be.true;
        });
        it('should skip streams that are not TTY', function () {
            const stream = createTTYStream();
            stream.isTTY = false;
            (0, utils_1.setBlocking)(true, [stream]);
            (0, chai_1.expect)(stream._handle.last).to.be.undefined;
        });
        it('should skip streams without a setBlocking handle', function () {
            const stream = { isTTY: true, _handle: {} };
            (0, chai_1.expect)(() => (0, utils_1.setBlocking)(true, [stream])).not.to.throw();
        });
    });
    describe('isPlainObject', function () {
        it('should return true for plain objects', function () {
            (0, chai_1.expect)((0, utils_1.isPlainObject)({})).to.be.true;
            (0, chai_1.expect)((0, utils_1.isPlainObject)({ a: 1 })).to.be.true;
            (0, chai_1.expect)((0, utils_1.isPlainObject)(Object.create(null))).to.be.true;
        });
        it('should return false for non-plain values', function () {
            (0, chai_1.expect)((0, utils_1.isPlainObject)(null)).to.be.false;
            (0, chai_1.expect)((0, utils_1.isPlainObject)([])).to.be.false;
            (0, chai_1.expect)((0, utils_1.isPlainObject)(new Date())).to.be.false;
            (0, chai_1.expect)((0, utils_1.isPlainObject)('x')).to.be.false;
        });
    });
    describe('escapeRegExp', function () {
        it('should escape regexp metacharacters', function () {
            (0, chai_1.expect)((0, utils_1.escapeRegExp)('a.b(c)')).to.eql('a\\.b\\(c\\)');
        });
    });
    describe('unleakString', function () {
        it('should unleak a string', function () {
            (0, chai_1.expect)((0, utils_1.unleakString)('yolo')).to.eql('yolo');
        });
        it('should unleak a multiline string', function () {
            (0, chai_1.expect)((0, utils_1.unleakString)(' yolo\nbolo ')).to.eql(' yolo\nbolo ');
        });
        it('should convert an object to a string', function () {
            for (const obj of [{}, null, undefined, [], 0]) {
                (0, chai_1.expect)((0, utils_1.unleakString)(obj)).to.eql(`${obj}`);
            }
        });
    });
});
//# sourceMappingURL=utils-specs.js.map