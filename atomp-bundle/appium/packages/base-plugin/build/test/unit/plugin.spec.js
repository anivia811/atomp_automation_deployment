"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const plugin_1 = require("../../lib/plugin");
const { expect } = chai_1.default;
describe('base plugin', function () {
    it('should exist', function () {
        expect(plugin_1.BasePlugin).to.exist;
    });
    it('should define its name', function () {
        const p = new plugin_1.BasePlugin('foo');
        expect(p.name).to.eql('foo');
    });
    it('should create a logger', function () {
        const p = new plugin_1.BasePlugin('foo');
        expect(p.log).to.exist;
    });
    it('should define a default list of no new methods', function () {
        expect(plugin_1.BasePlugin.newMethodMap).to.eql({});
    });
});
//# sourceMappingURL=plugin.spec.js.map