"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../../lib");
describe('TEST_HOST', function () {
    let expect;
    before(async function () {
        const chai = await import('chai');
        chai.should();
        expect = chai.expect;
    });
    it('should be localhost', function () {
        expect(lib_1.TEST_HOST).to.equal('127.0.0.1');
    });
});
describe('getTestPort()', function () {
    let expect;
    before(async function () {
        const chai = await import('chai');
        chai.should();
        expect = chai.expect;
    });
    it('should get a free test port', async function () {
        const port = await (0, lib_1.getTestPort)();
        expect(port).to.be.a('number');
    });
});
describe('createAppiumURL()', function () {
    let expect;
    let urlFor;
    before(async function () {
        const chai = await import('chai');
        chai.should();
        expect = chai.expect;
        urlFor = (0, lib_1.createAppiumURL)(lib_1.TEST_HOST, 31337);
    });
    it('should create a "new session" URL', function () {
        expect(urlFor('', 'session')).to.equal(`http://${lib_1.TEST_HOST}:31337/session`);
    });
    it('should create a URL to get an existing session', function () {
        const sessionId = '12345';
        expect(urlFor(sessionId, 'session')).to.equal(`http://${lib_1.TEST_HOST}:31337/session/${sessionId}/session`);
    });
    it('should create a URL for a command using an existing session', function () {
        const sessionId = '12345';
        expect(urlFor(sessionId, 'moocow')).to.equal(`http://${lib_1.TEST_HOST}:31337/session/${sessionId}/moocow`);
    });
});
//# sourceMappingURL=index.spec.js.map