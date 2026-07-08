"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../../lib");
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
(0, chai_1.use)(chai_as_promised_1.default);
describe('OpenCV', function () {
    it('should initialize opencv library', async function () {
        this.timeout('10s');
        await (0, lib_1.initOpenCv)();
        const buildInfo = require('opencv-bindings').getBuildInformation();
        (0, chai_1.expect)(buildInfo).to.include('OpenCV');
    });
});
//# sourceMappingURL=opencv.spec.js.map