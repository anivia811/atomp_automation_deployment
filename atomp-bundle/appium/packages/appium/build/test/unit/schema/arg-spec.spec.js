"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../../lib/constants");
const arg_spec_1 = require("../../../lib/schema/arg-spec");
const chai_1 = require("chai");
describe('ArgSpec', function () {
    describe('class method', function () {
        describe('create()', function () {
            it('should return a new ArgSpec', function () {
                (0, chai_1.expect)(arg_spec_1.ArgSpec.create('foo')).to.be.an.instanceof(arg_spec_1.ArgSpec);
            });
        });
        describe('toSchemaRef()', function () {
            describe('when provided no extension information', function () {
                it('should return a schema ID for a specific argument', function () {
                    (0, chai_1.expect)(arg_spec_1.ArgSpec.toSchemaRef('foo')).to.equal('appium.json#/properties/server/properties/foo');
                });
            });
            describe('when provided extension information', function () {
                it('should return a schema ID for a specific argument within an extension schema', function () {
                    (0, chai_1.expect)(arg_spec_1.ArgSpec.toSchemaRef('bar', constants_1.DRIVER_TYPE, 'stuff')).to.equal('driver-stuff.json#/properties/bar');
                });
            });
        });
        describe('toSchemaBaseRef()', function () {
            describe('when provided no extension information', function () {
                it('should return the base schema ID', function () {
                    (0, chai_1.expect)(arg_spec_1.ArgSpec.toSchemaBaseRef()).to.equal('appium.json');
                });
            });
            describe('when provided extension information', function () {
                it('should return a schema ID for an extension', function () {
                    (0, chai_1.expect)(arg_spec_1.ArgSpec.toSchemaBaseRef(constants_1.DRIVER_TYPE, 'stuff')).to.equal('driver-stuff.json');
                });
            });
        });
        describe('toArg()', function () {
            describe('when provided no extension information', function () {
                it('should return a bare arg name', function () {
                    (0, chai_1.expect)(arg_spec_1.ArgSpec.toArg('foo')).to.equal('foo');
                });
            });
            describe('when provided extension information', function () {
                it('should return an extension-specific arg name', function () {
                    (0, chai_1.expect)(arg_spec_1.ArgSpec.toArg('no-oats', constants_1.DRIVER_TYPE, 'bad-donkey')).to.equal('driver-bad-donkey-no-oats');
                });
            });
        });
        describe('extensionInfoFromRootSchemaId()', function () {
            describe('when provided the base schema ID', function () {
                it('should return an empty object', function () {
                    (0, chai_1.expect)(arg_spec_1.ArgSpec.extensionInfoFromRootSchemaId('appium.json')).to.be.empty;
                });
            });
            describe('when provided the schema ID of an extension schema', function () {
                it('should return a proper object', function () {
                    (0, chai_1.expect)(arg_spec_1.ArgSpec.extensionInfoFromRootSchemaId('driver-stuff.json')).to.eql({
                        extType: constants_1.DRIVER_TYPE,
                        normalizedExtName: 'stuff',
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=arg-spec.spec.js.map