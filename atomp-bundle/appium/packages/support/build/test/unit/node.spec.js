"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const lib_1 = require("../../lib");
const node_path_1 = __importDefault(require("node:path"));
describe('node utilities', function () {
    describe('getObjectSize', function () {
        it('should be able to calculate size of different object types', function () {
            (0, chai_1.expect)(lib_1.node.getObjectSize(1)).to.eql(8);
            (0, chai_1.expect)(lib_1.node.getObjectSize(true)).to.eql(4);
            (0, chai_1.expect)(lib_1.node.getObjectSize('yolo')).to.eql(8);
            (0, chai_1.expect)(lib_1.node.getObjectSize(null)).to.eql(0);
            (0, chai_1.expect)(lib_1.node.getObjectSize({})).to.eql(0);
            (0, chai_1.expect)(lib_1.node.getObjectSize(Buffer.from([1, 2, 3]))).to.eql(3);
            (0, chai_1.expect)(lib_1.node.getObjectSize({
                a: 1,
                b: 2,
                c: {
                    d: 4,
                },
            })).to.eql(32);
        });
    });
    describe('getModuleRootSync', function () {
        it("should be able to find current module's root", function () {
            (0, chai_1.expect)(node_path_1.default.resolve(__dirname)).to.contain(lib_1.node.getModuleRootSync('@appium/support', __filename));
        });
        it('should return null if no root is found', function () {
            (0, chai_1.expect)(lib_1.node.getModuleRootSync('yolo', __filename)).to.be.null;
        });
    });
    describe('getObjectId', function () {
        it('should be able to calculate object identifiers', function () {
            const obj1 = {};
            const obj2 = {};
            (0, chai_1.expect)(lib_1.node.getObjectId({})).to.not.eql(lib_1.node.getObjectId(obj1));
            (0, chai_1.expect)(lib_1.node.getObjectId({})).to.not.eql(lib_1.node.getObjectId(obj2));
            (0, chai_1.expect)(lib_1.node.getObjectId(obj1)).to.not.eql(lib_1.node.getObjectId(obj2));
            (0, chai_1.expect)(lib_1.node.getObjectId(obj1)).to.eql(lib_1.node.getObjectId(obj1));
            (0, chai_1.expect)(lib_1.node.getObjectId(obj2)).to.eql(lib_1.node.getObjectId(obj2));
        });
    });
    describe('deepFreeze', function () {
        it('should be able to deep freeze objects', function () {
            const obj1 = {};
            (0, chai_1.expect)(lib_1.node.deepFreeze(obj1)).to.eql(obj1);
            const obj2 = lib_1.node.deepFreeze({ a: { b: 'c' } });
            (0, chai_1.expect)(() => (obj2.a.b = 'd')).to.throw();
            (0, chai_1.expect)(lib_1.node.deepFreeze(1)).to.eql(1);
            (0, chai_1.expect)(lib_1.node.deepFreeze(null)).to.equal(null);
            const obj3 = [1, {}, 3];
            (0, chai_1.expect)(lib_1.node.deepFreeze(obj3)).to.equal(obj3);
        });
    });
});
//# sourceMappingURL=node.spec.js.map