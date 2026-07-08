"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_1 = require("../../lib/plugin");
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
(0, chai_1.use)(chai_as_promised_1.default);
describe('execute driver plugin', function () {
    it('should exist', function () {
        (0, chai_1.expect)(plugin_1.ExecuteDriverPlugin).to.exist;
    });
});
//# sourceMappingURL=plugin.spec.js.map