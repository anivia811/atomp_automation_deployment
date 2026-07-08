"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const object_1 = require("../../../lib/utils/object");
describe('utils/object', function () {
    describe('kebabCase()', function () {
        it('should convert camelCase and snake_case to kebab-case', function () {
            (0, chai_1.expect)((0, object_1.kebabCase)('fooBar')).to.equal('foo-bar');
            (0, chai_1.expect)((0, object_1.kebabCase)('foo_bar')).to.equal('foo-bar');
            (0, chai_1.expect)((0, object_1.kebabCase)('Foo Bar')).to.equal('foo-bar');
        });
        it('should split acronym boundaries like lodash', function () {
            (0, chai_1.expect)((0, object_1.kebabCase)('someXMLParser')).to.equal('some-xml-parser');
            (0, chai_1.expect)((0, object_1.kebabCase)('getHTTPResponse')).to.equal('get-http-response');
            (0, chai_1.expect)((0, object_1.kebabCase)('XMLHttpRequest')).to.equal('xml-http-request');
        });
    });
    describe('camelCase()', function () {
        it('should convert kebab-case and snake_case to camelCase', function () {
            (0, chai_1.expect)((0, object_1.camelCase)('foo-bar')).to.equal('fooBar');
            (0, chai_1.expect)((0, object_1.camelCase)('foo_bar')).to.equal('fooBar');
            (0, chai_1.expect)((0, object_1.camelCase)('Foo Bar')).to.equal('fooBar');
        });
        it('should return an empty string for whitespace-only input', function () {
            (0, chai_1.expect)((0, object_1.camelCase)('   ')).to.equal('');
        });
    });
    describe('capitalize()', function () {
        it('should uppercase the first character', function () {
            (0, chai_1.expect)((0, object_1.capitalize)('hello')).to.equal('Hello');
        });
        it('should return an empty string unchanged', function () {
            (0, chai_1.expect)((0, object_1.capitalize)('')).to.equal('');
        });
    });
    describe('omitKeys()', function () {
        it('should omit multiple keys from a plain object', function () {
            (0, chai_1.expect)((0, object_1.omitKeys)({ a: 1, b: 2, c: 3 }, ['a', 'c'])).to.eql({ b: 2 });
        });
        it('should return the same object when keys is empty', function () {
            const obj = { a: 1 };
            (0, chai_1.expect)((0, object_1.omitKeys)(obj, [])).to.equal(obj);
        });
        it('should return non-plain objects unchanged', function () {
            (0, chai_1.expect)((0, object_1.omitKeys)(null, ['a'])).to.equal(null);
        });
    });
    describe('pickBy()', function () {
        it('should keep entries that pass the predicate', function () {
            (0, chai_1.expect)((0, object_1.pickBy)({ a: 1, b: '', c: 3 }, (value) => value !== '')).to.eql({ a: 1, c: 3 });
        });
        it('should pass key to the predicate', function () {
            (0, chai_1.expect)((0, object_1.pickBy)({ a: 1, b: 2 }, (_value, key) => key === 'a')).to.eql({ a: 1 });
        });
    });
    describe('mapValues()', function () {
        it('should transform values while preserving keys', function () {
            (0, chai_1.expect)((0, object_1.mapValues)({ a: 1, b: 2 }, (v) => v * 2)).to.eql({ a: 2, b: 4 });
        });
    });
    describe('mapKeys()', function () {
        it('should rename keys while preserving values', function () {
            (0, chai_1.expect)((0, object_1.mapKeys)({ a: 1 }, (_v, key) => `${key}Key`)).to.eql({ aKey: 1 });
        });
    });
    describe('getPath()', function () {
        it('should read nested dot-separated paths', function () {
            (0, chai_1.expect)((0, object_1.getPath)({ a: { b: { c: 3 } } }, 'a.b.c')).to.equal(3);
        });
        it('should return defaultValue when a segment is missing', function () {
            (0, chai_1.expect)((0, object_1.getPath)({ a: 1 }, 'a.b.c', 'default')).to.equal('default');
            (0, chai_1.expect)((0, object_1.getPath)(null, 'a', 'default')).to.equal('default');
        });
        it('should return defaultValue when the resolved value is undefined', function () {
            (0, chai_1.expect)((0, object_1.getPath)({ a: undefined }, 'a', 'default')).to.equal('default');
        });
        it('should read paths with hyphenated property segments', function () {
            const schema = {
                properties: {
                    server: {
                        properties: {
                            'allow-cors': { appiumCliDest: 'allowCors' },
                            log: { appiumCliDest: 'logFile' },
                        },
                    },
                },
            };
            (0, chai_1.expect)((0, object_1.getPath)(schema, 'properties.server.properties.log.appiumCliDest')).to.equal('logFile');
            (0, chai_1.expect)((0, object_1.getPath)(schema, 'properties.server.properties.allow-cors.appiumCliDest')).to.equal('allowCors');
        });
    });
    describe('setPath()', function () {
        it('should assign nested values and create plain object segments', function () {
            const obj = {};
            (0, object_1.setPath)(obj, 'a.b.c', 3);
            (0, chai_1.expect)(obj).to.eql({ a: { b: { c: 3 } } });
        });
        it('should replace non-plain intermediate values with plain objects', function () {
            const obj = { a: { b: null } };
            (0, object_1.setPath)(obj, 'a.b.c', 1);
            (0, chai_1.expect)(obj).to.eql({ a: { b: { c: 1 } } });
        });
        it('should no-op on unsafe path segments', function () {
            const obj = {};
            const sentinel = 'polluted';
            for (const path of ['__proto__.x', 'a.__proto__.x', 'constructor.x', 'prototype.x']) {
                (0, object_1.setPath)(obj, path, sentinel);
            }
            (0, chai_1.expect)(obj).to.eql({});
            (0, chai_1.expect)({}[sentinel]).to.be.undefined;
        });
        it('should no-op on paths with empty segments', function () {
            const obj = {};
            (0, object_1.setPath)(obj, 'a..b', 1);
            (0, chai_1.expect)(obj).to.eql({});
        });
    });
    describe('bindAll()', function () {
        it('should bind listed methods so they keep the correct this', function () {
            const target = {
                value: 1,
                getValue() {
                    return this.value;
                },
            };
            const unbound = target.getValue;
            (0, chai_1.expect)(unbound.call({ value: 99 })).to.equal(99);
            (0, object_1.bindAll)(target, ['getValue']);
            const extracted = target.getValue;
            (0, chai_1.expect)(extracted()).to.equal(1);
            (0, chai_1.expect)(extracted.call({ value: 99 })).to.equal(1);
            (0, chai_1.expect)(target.getValue()).to.equal(1);
        });
        it('should ignore non-function properties', function () {
            const target = { a: 1 };
            (0, chai_1.expect)((0, object_1.bindAll)(target, ['a'])).to.equal(target);
        });
    });
    describe('compact()', function () {
        it('should remove falsy entries', function () {
            (0, chai_1.expect)((0, object_1.compact)([0, 1, '', 'x', false, null, undefined])).to.eql([1, 'x']);
        });
    });
    describe('pull()', function () {
        it('should remove all occurrences of the given values', function () {
            const arr = [1, 2, 1, 3, 1];
            (0, chai_1.expect)((0, object_1.pull)(arr, 1)).to.equal(arr);
            (0, chai_1.expect)(arr).to.eql([2, 3]);
        });
    });
    describe('zip()', function () {
        it('should pair elements by index', function () {
            (0, chai_1.expect)((0, object_1.zip)([1, 2], ['a', 'b'])).to.eql([
                [1, 'a'],
                [2, 'b'],
            ]);
        });
        it('should use undefined when the second array is shorter', function () {
            (0, chai_1.expect)((0, object_1.zip)([1, 2], ['a'])).to.eql([
                [1, 'a'],
                [2, undefined],
            ]);
        });
    });
    describe('difference()', function () {
        it('should return elements in the first array not present in the second', function () {
            (0, chai_1.expect)((0, object_1.difference)([1, 2, 3, 2], [2, 4])).to.eql([1, 3]);
        });
    });
    describe('defaultsDeep()', function () {
        it('should fill only undefined properties recursively for plain objects', function () {
            const result = (0, object_1.defaultsDeep)({ a: 1, nested: { x: 1 } }, { b: 2, nested: { y: 2, z: 3 } });
            (0, chai_1.expect)(result).to.eql({ a: 1, b: 2, nested: { x: 1, y: 2, z: 3 } });
        });
        it('should not overwrite defined nested values with defaults', function () {
            const result = (0, object_1.defaultsDeep)({ nested: { x: 1, y: 2 } }, { nested: { x: 9, z: 3 } });
            (0, chai_1.expect)(result).to.eql({ nested: { x: 1, y: 2, z: 3 } });
        });
        it('should skip null and undefined sources', function () {
            (0, chai_1.expect)((0, object_1.defaultsDeep)({ a: 1 }, undefined, { b: 2 })).to.eql({ a: 1, b: 2 });
            (0, chai_1.expect)((0, object_1.defaultsDeep)({ a: 1 }, null, { b: 2 })).to.eql({ a: 1, b: 2 });
        });
        it('should merge multiple sources in order', function () {
            (0, chai_1.expect)((0, object_1.defaultsDeep)({}, { a: 1 }, { b: 2 })).to.eql({ a: 1, b: 2 });
        });
        it('should not mutate source objects', function () {
            const source = { nested: { y: 2 } };
            (0, object_1.defaultsDeep)({ nested: { x: 1 } }, source);
            (0, chai_1.expect)(source).to.eql({ nested: { y: 2 } });
        });
        it('should copy functions by reference when filling undefined keys', function () {
            const logHandler = () => { };
            const result = (0, object_1.defaultsDeep)({}, { logHandler });
            (0, chai_1.expect)(result.logHandler).to.equal(logHandler);
        });
        it('should merge later sources when earlier sources include functions', function () {
            const logHandler = () => { };
            const result = (0, object_1.defaultsDeep)({}, { logHandler }, { port: 4723 });
            (0, chai_1.expect)(result.logHandler).to.equal(logHandler);
            (0, chai_1.expect)(result.port).to.equal(4723);
        });
    });
});
//# sourceMappingURL=object.spec.js.map