"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const network_1 = require("../../../lib/helpers/network");
describe('helpers/network', function () {
    before(async function () {
        (0, chai_1.use)(chai_as_promised_1.default);
    });
    describe('fetchInterfaces()', function () {
        it('should fetch interfaces for ipv4 only', function () {
            (0, chai_1.expect)((0, network_1.fetchInterfaces)(4).length).to.be.greaterThan(0);
        });
        it('should fetch interfaces for ipv6 only', function () {
            (0, chai_1.expect)((0, network_1.fetchInterfaces)(6).length).to.be.greaterThan(0);
        });
        it('should fetch interfaces for ipv4 and ipv6', function () {
            (0, chai_1.expect)((0, network_1.fetchInterfaces)().length).to.be.greaterThan(0);
        });
    });
});
//# sourceMappingURL=network.spec.js.map