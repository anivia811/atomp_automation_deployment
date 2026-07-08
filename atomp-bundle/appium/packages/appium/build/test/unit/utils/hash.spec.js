"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hash_1 = require("../../../lib/utils/hash");
describe('utils/hash', function () {
    describe('adler32()', function () {
        it('should compute checksum for known inputs', function () {
            (0, chai_1.expect)((0, hash_1.adler32)('')).to.equal(1);
            (0, chai_1.expect)((0, hash_1.adler32)('hello')).to.equal(103547413);
            (0, chai_1.expect)((0, hash_1.adler32)('😀')).to.equal(122749608);
        });
        it('should support checksum seeding', function () {
            const seed = (0, hash_1.adler32)('hello');
            (0, chai_1.expect)((0, hash_1.adler32)(' world', seed)).to.equal((0, hash_1.adler32)('hello world'));
        });
    });
});
//# sourceMappingURL=hash.spec.js.map