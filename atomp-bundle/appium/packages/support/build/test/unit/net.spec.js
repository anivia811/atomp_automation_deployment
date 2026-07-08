"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const net_1 = require("../../lib/net");
describe('net', function () {
    describe('uploadFile()', function () {
        it('should accept remote URLs typed as strings', function () {
            const upload = (remoteUri) => (0, net_1.uploadFile)('/path/to/local/file', remoteUri, {
                method: 'PUT',
                headers: { 'content-type': 'video/mp4' },
            });
            (0, chai_1.expect)(upload).to.be.a('function');
        });
    });
});
//# sourceMappingURL=net.spec.js.map