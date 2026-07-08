"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const xpath_1 = require("../../lib/xpath");
const source_1 = require("../../lib/source");
const fixtures_1 = require("../fixtures");
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
(0, chai_1.use)(chai_as_promised_1.default);
describe('xpath functions', function () {
    describe('runQuery', function () {
        it('should run an xpath query on an XML string and return nodes', function () {
            (0, chai_1.expect)((0, xpath_1.runQuery)('//*', fixtures_1.XML_IOS)).to.have.length(31);
            (0, chai_1.expect)((0, xpath_1.runQuery)('//XCUIElementTypeTextField', fixtures_1.XML_IOS)).to.have.length(1);
        });
    });
    describe('transformQuery', function () {
        it('should transform a query into a single new query', async function () {
            const { xml } = await (0, source_1.transformSourceXml)(fixtures_1.XML_IOS, 'ios', { addIndexPath: true });
            (0, chai_1.expect)((0, xpath_1.transformQuery)('//TextInput', xml, false)).to.eql('/*[1]/*[1]/*[1]/*[1]/*[2]/*[1]/*[1]/*[1]/*[1]/*[1]/*[1]/*[2]/*[1]/*[1]/*[1]');
        });
        it('should transform a query into a multiple new queries if asked', async function () {
            const { xml } = await (0, source_1.transformSourceXml)(fixtures_1.XML_IOS, 'ios', { addIndexPath: true });
            (0, chai_1.expect)((0, xpath_1.transformQuery)('//Window', xml, true)?.split('|')).to.have.length(2);
        });
        it('should return null for queries that dont find anything', async function () {
            const { xml } = await (0, source_1.transformSourceXml)(fixtures_1.XML_IOS, 'ios', { addIndexPath: true });
            (0, chai_1.expect)((0, xpath_1.transformQuery)('//blah', xml, false)).to.be.null;
        });
    });
    describe('getNodeAttrVal', function () {
        it('should get the attribute for a node', function () {
            const node = (0, xpath_1.runQuery)('//XCUIElementTypeTextField', fixtures_1.XML_IOS)[0];
            (0, chai_1.expect)((0, xpath_1.getNodeAttrVal)(node, 'name')).to.eql('username');
        });
        it('should throw an error if the attr does not exist', function () {
            const node = (0, xpath_1.runQuery)('//XCUIElementTypeTextField', fixtures_1.XML_IOS)[0];
            (0, chai_1.expect)(() => (0, xpath_1.getNodeAttrVal)(node, 'foo')).to.throw();
        });
    });
});
//# sourceMappingURL=xpath.spec.js.map