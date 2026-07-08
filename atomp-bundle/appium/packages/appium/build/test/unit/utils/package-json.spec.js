"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const package_json_1 = require("../../../lib/utils/package-json");
const { expect } = chai_1.default;
describe('utils/package-json', function () {
    describe('npmPackage', function () {
        it('should expose package metadata', function () {
            expect(package_json_1.npmPackage).to.have.property('name', 'appium');
        });
    });
});
//# sourceMappingURL=package-json.spec.js.map