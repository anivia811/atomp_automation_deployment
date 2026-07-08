"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const lib_1 = __importDefault(require("../../lib/"));
const { system, tempDir, util } = lib_1.default;
describe('index', function () {
    describe('default', function () {
        it('should expose an object', function () {
            (0, chai_1.expect)(lib_1.default).to.exist;
            (0, chai_1.expect)(lib_1.default).to.be.an.instanceof(Object);
        });
        it('should expose system object', function () {
            (0, chai_1.expect)(lib_1.default.system).to.exist;
            (0, chai_1.expect)(lib_1.default.system).to.be.an.instanceof(Object);
        });
        it('should expose tempDir object', function () {
            (0, chai_1.expect)(lib_1.default.tempDir).to.exist;
            (0, chai_1.expect)(lib_1.default.tempDir).to.be.an.instanceof(Object);
        });
        it('should expose util object', function () {
            (0, chai_1.expect)(lib_1.default.util).to.exist;
            (0, chai_1.expect)(lib_1.default.util).to.be.an.instanceof(Object);
        });
    });
    it('should expose an object as "system" ', function () {
        (0, chai_1.expect)(system).to.be.an.instanceof(Object);
    });
    it('should expose an object as "tempDir" ', function () {
        (0, chai_1.expect)(tempDir).to.be.an.instanceof(Object);
    });
    it('should expose an object as "util" ', function () {
        (0, chai_1.expect)(util).to.be.an.instanceof(Object);
    });
});
//# sourceMappingURL=index.spec.js.map