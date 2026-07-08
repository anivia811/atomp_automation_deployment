"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fixtures_1 = require("../fixtures");
const source_1 = require("../../lib/source");
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
(0, chai_1.use)(chai_as_promised_1.default);
describe('source functions', function () {
    describe('transformSourceXml', function () {
        it('should transform an xml doc based on platform', async function () {
            const { xml, unknowns: { nodes, attrs }, } = await (0, source_1.transformSourceXml)(fixtures_1.XML_IOS, 'ios');
            (0, chai_1.expect)(xml).to.eql(fixtures_1.XML_IOS_TRANSFORMED);
            (0, chai_1.expect)(nodes).to.eql([]);
            (0, chai_1.expect)(attrs).to.eql([]);
        });
        it('should transform an xml doc and include index path', async function () {
            const { xml, unknowns: { nodes, attrs }, } = await (0, source_1.transformSourceXml)(fixtures_1.XML_IOS, 'ios', { addIndexPath: true });
            (0, chai_1.expect)(xml).to.eql(fixtures_1.XML_IOS_TRANSFORMED_INDEX_PATH);
            (0, chai_1.expect)(nodes).to.eql([]);
            (0, chai_1.expect)(attrs).to.eql([]);
        });
        it('should transform an xml doc and return any unknown nodes or attrs', async function () {
            const { xml, unknowns: { nodes, attrs }, } = await (0, source_1.transformSourceXml)(fixtures_1.XML_IOS_EDGE, 'ios');
            (0, chai_1.expect)(xml).to.eql(fixtures_1.XML_IOS_EDGE_TRANSFORMED);
            (0, chai_1.expect)(nodes).to.eql(['SomeRandoElement']);
            (0, chai_1.expect)(attrs).to.eql(['oddAttribute']);
        });
    });
    describe('transformChildNodes', function () {
        it('should loop through child nodes of an object and transform them based on platform', function () {
            const node = {
                XCUIElementTypeIcon: [{}],
                XCUIElementTypeKey: [{}],
                XCUIElementTypeTab: [{}],
            };
            const metadata = {};
            (0, chai_1.expect)((0, source_1.transformChildNodes)(node, Object.keys(node), 'ios', metadata)).to.eql({
                nodes: [],
                attrs: [],
            });
            (0, chai_1.expect)(node).to.eql({ Button: [{}, {}], Icon: [{}] });
        });
        it('should leave unknown nodes intact and add them to unknowns list', function () {
            const node = {
                XCUIElementTypeIcon: [{}],
                UnknownThingo: [{}],
                XCUIElementTypeTab: [{}],
            };
            const metadata = {};
            (0, chai_1.expect)((0, source_1.transformChildNodes)(node, Object.keys(node), 'ios', metadata)).to.eql({
                nodes: ['UnknownThingo'],
                attrs: [],
            });
            (0, chai_1.expect)(node).to.eql({ Button: [{}], UnknownThingo: [{}], Icon: [{}] });
        });
        it('should leave nodes for other platforms intact and add them to unknowns list', function () {
            const node = {
                XCUIElementTypeIcon: [{}],
                'android.widget.EditText': [{}],
                XCUIElementTypeTab: [{}],
            };
            const metadata = {};
            (0, chai_1.expect)((0, source_1.transformChildNodes)(node, Object.keys(node), 'ios', metadata)).to.eql({
                nodes: ['android.widget.EditText'],
                attrs: [],
            });
            (0, chai_1.expect)(node).to.eql({
                Button: [{}],
                'android.widget.EditText': [{}],
                Icon: [{}],
            });
        });
    });
    describe('transformAttrs', function () {
        it('should remove attributes in the REMOVE_ATTRS list', function () {
            const obj = { '@_type': 'foo', '@_package': 'yes', '@_class': 'lol' };
            const attrs = Object.keys(obj);
            const unknowns = (0, source_1.transformAttrs)(obj, attrs, 'ios');
            (0, chai_1.expect)(obj).to.eql({});
            (0, chai_1.expect)(unknowns).to.eql([]);
        });
        it('should translate attributes for the platform', function () {
            const obj = { '@_type': 'foo', '@_resource-id': 'someId' };
            const attrs = Object.keys(obj);
            const unknowns = (0, source_1.transformAttrs)(obj, attrs, 'android');
            (0, chai_1.expect)(obj).to.eql({ '@_id': 'someId' });
            (0, chai_1.expect)(unknowns).to.eql([]);
        });
        it('should not translate unknown attributes and return them in the unknowns list', function () {
            const obj = {
                '@_type': 'foo',
                '@_resource-id': 'someId',
                '@_rando': 'lorian',
            };
            const attrs = Object.keys(obj);
            const unknowns = (0, source_1.transformAttrs)(obj, attrs, 'android');
            (0, chai_1.expect)(obj).to.eql({ '@_id': 'someId', '@_rando': 'lorian' });
            (0, chai_1.expect)(unknowns).to.eql(['rando']);
        });
        it('should not translate attributes for a different platform', function () {
            const obj = { '@_type': 'foo', '@_resource-id': 'someId' };
            const attrs = Object.keys(obj);
            const unknowns = (0, source_1.transformAttrs)(obj, attrs, 'ios');
            (0, chai_1.expect)(obj).to.eql({ '@_resource-id': 'someId' });
            (0, chai_1.expect)(unknowns).to.eql(['resource-id']);
        });
    });
});
//# sourceMappingURL=source.spec.js.map