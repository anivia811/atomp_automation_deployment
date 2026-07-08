"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon_1 = require("sinon");
const schema_1 = require("../../../lib/schema/schema");
const helpers_1 = require("../../helpers");
const chai_1 = require("chai");
describe('cli/schema-args', function () {
    let toParserArgs;
    let sandbox;
    beforeEach(function () {
        sandbox = (0, sinon_1.createSandbox)();
        ({ toParserArgs } = helpers_1.rewiremock.proxy(() => require('../../../lib/schema/cli-args')));
    });
    afterEach(function () {
        sandbox.restore();
    });
    describe('toParserArgs()', function () {
        describe('when called with no parameters', function () {
            beforeEach(schema_1.finalizeSchema);
            afterEach(schema_1.resetSchema);
            it('should return a Map', function () {
                (0, chai_1.expect)(toParserArgs()).to.be.an.instanceof(Map).and.have.property('size').that.is.above(0);
            });
            it('should generate metavars in SCREAMING_SNAKE_CASE', function () {
                const argDefs = toParserArgs();
                const argDefsWithMetavar = [...argDefs].filter((arg) => arg[1].metavar);
                (0, chai_1.expect)(argDefsWithMetavar).not.to.be.empty;
                (0, chai_1.expect)(argDefsWithMetavar.every((arg) => /[A-Z_]+/.test(arg[1].metavar ?? ''))).to.be.true;
            });
        });
        describe('when schema has not yet been compiled', function () {
            it('should throw', function () {
                (0, schema_1.resetSchema)();
                (0, chai_1.expect)(() => toParserArgs()).to.throw(schema_1.SchemaFinalizationError);
            });
        });
    });
});
//# sourceMappingURL=schema-args.spec.js.map