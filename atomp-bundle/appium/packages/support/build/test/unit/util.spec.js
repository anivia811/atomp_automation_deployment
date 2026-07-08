"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const lib_1 = require("../../lib");
const asyncbox_1 = require("asyncbox");
const sinon_1 = require("sinon");
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const { W3C_WEB_ELEMENT_IDENTIFIER } = lib_1.util;
describe('util', function () {
    let sandbox;
    before(function () {
        (0, chai_1.use)(chai_as_promised_1.default);
    });
    beforeEach(function () {
        sandbox = (0, sinon_1.createSandbox)();
    });
    afterEach(function () {
        sandbox.restore();
    });
    describe('hasValue', function () {
        it('should exist', function () {
            (0, chai_1.expect)(lib_1.util.hasValue).to.exist;
        });
        it('should handle undefined', function () {
            (0, chai_1.expect)(lib_1.util.hasValue(undefined)).to.be.false;
        });
        it('should handle not a number', function () {
            (0, chai_1.expect)(lib_1.util.hasValue(NaN)).to.be.false;
        });
        it('should handle null', function () {
            (0, chai_1.expect)(lib_1.util.hasValue(null)).to.be.false;
        });
        it('should handle functions', function () {
            (0, chai_1.expect)(lib_1.util.hasValue(function () { })).to.be.true;
        });
        it('should handle empty arrays', function () {
            (0, chai_1.expect)(lib_1.util.hasValue({})).to.be.true;
        });
        it('should handle zero', function () {
            (0, chai_1.expect)(lib_1.util.hasValue(0)).to.be.true;
        });
        it('should handle simple string', function () {
            (0, chai_1.expect)(lib_1.util.hasValue('string')).to.be.true;
        });
        it('should handle booleans', function () {
            (0, chai_1.expect)(lib_1.util.hasValue(false)).to.be.true;
        });
        it('should handle empty strings', function () {
            (0, chai_1.expect)(lib_1.util.hasValue('')).to.be.true;
        });
    });
    describe('hasContent', function () {
        it('should exist', function () {
            (0, chai_1.expect)(lib_1.util.hasContent).to.exist;
        });
        it('should handle undefined', function () {
            (0, chai_1.expect)(lib_1.util.hasContent(undefined)).to.be.false;
        });
        it('should handle not a number', function () {
            (0, chai_1.expect)(lib_1.util.hasContent(NaN)).to.be.false;
        });
        it('should handle null', function () {
            (0, chai_1.expect)(lib_1.util.hasContent(null)).to.be.false;
        });
        it('should handle functions', function () {
            (0, chai_1.expect)(lib_1.util.hasContent(function () { })).to.be.false;
        });
        it('should handle empty arrays', function () {
            (0, chai_1.expect)(lib_1.util.hasContent({})).to.be.false;
        });
        it('should handle zero', function () {
            (0, chai_1.expect)(lib_1.util.hasContent(0)).to.be.false;
        });
        it('should handle simple string', function () {
            (0, chai_1.expect)(lib_1.util.hasContent('string')).to.be.true;
        });
        it('should handle booleans', function () {
            (0, chai_1.expect)(lib_1.util.hasContent(false)).to.be.false;
        });
        it('should handle empty strings', function () {
            (0, chai_1.expect)(lib_1.util.hasContent('')).to.be.false;
        });
    });
    describe('escapeSpace', function () {
        it('should do nothing to a string without space', function () {
            const actual = 'appium';
            const expected = 'appium';
            (0, chai_1.expect)(lib_1.util.escapeSpace(actual)).to.equal(expected);
        });
        it('should do escape spaces', function () {
            const actual = '/Applications/ Xcode 6.1.1.app/Contents/Developer';
            const expected = '/Applications/\\ Xcode\\ 6.1.1.app/Contents/Developer';
            (0, chai_1.expect)(lib_1.util.escapeSpace(actual)).to.equal(expected);
        });
        it('should escape consecutive spaces', function () {
            const actual = 'appium   space';
            const expected = 'appium\\ \\ \\ space';
            (0, chai_1.expect)(lib_1.util.escapeSpace(actual)).to.equal(expected);
        });
    });
    describe('localIp', function () {
        it('should find a local ip address', function () {
            const ifConfigOut = {
                lo0: [
                    {
                        address: '::1',
                        netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
                        family: 'IPv6',
                        mac: '00:00:00:00:00:00',
                        scopeid: 0,
                        internal: true,
                    },
                    {
                        address: '127.0.0.1',
                        netmask: '255.0.0.0',
                        family: 'IPv4',
                        mac: '00:00:00:00:00:00',
                        internal: true,
                    },
                    {
                        address: 'fe80::1',
                        netmask: 'ffff:ffff:ffff:ffff::',
                        family: 'IPv6',
                        mac: '00:00:00:00:00:00',
                        scopeid: 1,
                        internal: true,
                    },
                ],
                en0: [
                    {
                        address: 'xxx',
                        netmask: 'ffff:ffff:ffff:ffff::',
                        family: 'IPv6',
                        mac: 'd0:e1:40:93:56:9a',
                        scopeid: 4,
                        internal: false,
                    },
                    {
                        address: '123.123.123.123',
                        netmask: '255.255.254.0',
                        family: 'IPv4',
                        mac: 'xxx',
                        internal: false,
                    },
                ],
                awdl0: [
                    {
                        address: 'xxx',
                        netmask: 'ffff:ffff:ffff:ffff::',
                        family: 'IPv6',
                        mac: 'xxx',
                        scopeid: 7,
                        internal: false,
                    },
                ],
            };
            const osMock = sandbox.mock(node_os_1.default);
            osMock.expects('networkInterfaces').returns(ifConfigOut);
            const ip = lib_1.util.localIp();
            (0, chai_1.expect)(ip).to.eql('123.123.123.123');
            osMock.verify();
        });
    });
    describe('cancellableDelay', function () {
        it('should delay', async function () {
            await lib_1.util.cancellableDelay(10);
        });
        it('cancel should work', async function () {
            const delay = lib_1.util.cancellableDelay(1000);
            await (0, asyncbox_1.sleep)(10);
            delay.cancel();
            await (0, chai_1.expect)(delay).to.eventually.be.rejectedWith(/cancellation error/);
        });
    });
    describe('safeJsonParse', function () {
        it('should pass object through', function () {
            const obj = { a: 'a', b: 'b' };
            (0, chai_1.expect)(lib_1.util.safeJsonParse(obj)).to.equal(obj);
        });
        it('should correctly parse json string', function () {
            const obj = { a: 'a', b: 'b' };
            (0, chai_1.expect)(lib_1.util.safeJsonParse(JSON.stringify(obj))).to.eql(obj);
        });
        it('should pass an array through', function () {
            const arr = ['a', 'b'];
            (0, chai_1.expect)(lib_1.util.safeJsonParse(arr)).to.eql(arr);
        });
        it('should correctly parse json array', function () {
            const arr = ['a', 'b'];
            (0, chai_1.expect)(lib_1.util.safeJsonParse(JSON.stringify(arr))).to.eql(arr);
        });
        it('should pass null through', function () {
            const obj = null;
            (0, chai_1.expect)(lib_1.util.safeJsonParse(obj)).to.be.null;
        });
        it('should pass simple string through', function () {
            const str = 'str';
            (0, chai_1.expect)(lib_1.util.safeJsonParse(str)).to.eql(str);
        });
        it('should pass a number through', function () {
            const num = 42;
            (0, chai_1.expect)(lib_1.util.safeJsonParse(num)).to.eql(num);
        });
        it('should make a number from a string representation', function () {
            const num = 42;
            (0, chai_1.expect)(lib_1.util.safeJsonParse(String(num))).to.eql(num);
        });
    });
    describe('jsonStringify', function () {
        it('should use JSON.stringify if no Buffer involved', function () {
            const obj = { k1: 'v1', k2: 'v2', k3: 'v3' };
            const jsonString = JSON.stringify(obj, null, 2);
            (0, chai_1.expect)(lib_1.util.jsonStringify(obj)).to.eql(jsonString);
        });
        it('should serialize a Buffer', function () {
            const obj = {
                k1: 'v1',
                k2: 'v2',
                k3: Buffer.from('hi how are you today'),
            };
            (0, chai_1.expect)(lib_1.util.jsonStringify(obj)).to.include('hi how are you today');
        });
        it('should use the replacer function on non-buffer values', function () {
            const obj = { k1: 'v1', k2: 'v2', k3: 'v3' };
            function replacer(_key, value) {
                return typeof value === 'string' ? value.toUpperCase() : value;
            }
            const jsonString = lib_1.util.jsonStringify(obj, replacer);
            (0, chai_1.expect)(jsonString).to.include('V1');
            (0, chai_1.expect)(jsonString).to.include('V2');
            (0, chai_1.expect)(jsonString).to.include('V3');
        });
        it('should use the replacer function on buffers', function () {
            const obj = {
                k1: 'v1',
                k2: 'v2',
                k3: Buffer.from('hi how are you today'),
            };
            function replacer(_key, value) {
                return typeof value === 'string' ? value.toUpperCase() : value;
            }
            const jsonString = lib_1.util.jsonStringify(obj, replacer);
            (0, chai_1.expect)(jsonString).to.include('V1');
            (0, chai_1.expect)(jsonString).to.include('V2');
            (0, chai_1.expect)(jsonString).to.include('HI HOW ARE YOU TODAY');
        });
        it('should use the replacer function recursively', function () {
            const obj = {
                k1: 'v1',
                k2: 'v2',
                k3: Buffer.from('hi how are you today'),
                k4: { k5: 'v5' },
            };
            function replacer(_key, value) {
                return typeof value === 'string' ? value.toUpperCase() : value;
            }
            const jsonString = lib_1.util.jsonStringify(obj, replacer);
            (0, chai_1.expect)(jsonString).to.include('V1');
            (0, chai_1.expect)(jsonString).to.include('V2');
            (0, chai_1.expect)(jsonString).to.include('HI HOW ARE YOU TODAY');
            (0, chai_1.expect)(jsonString).to.include('V5');
        });
    });
    describe('unwrapElement', function () {
        it('should pass through an unwrapped element', function () {
            const el = 4;
            (0, chai_1.expect)(lib_1.util.unwrapElement(el)).to.equal(el);
        });
        it('should not throw for null element input', function () {
            (0, chai_1.expect)(lib_1.util.unwrapElement(null)).to.equal(null);
        });
        it('should pass through an element that is an object', function () {
            const el = { RANDOM: 4 };
            (0, chai_1.expect)(lib_1.util.unwrapElement(el)).to.equal(el);
        });
        it('should unwrap a wrapped element', function () {
            const el = { ELEMENT: 4 };
            (0, chai_1.expect)(lib_1.util.unwrapElement(el)).to.eql(4);
        });
        it('should unwrap a wrapped element that uses W3C element identifier', function () {
            const el = { [W3C_WEB_ELEMENT_IDENTIFIER]: 5 };
            (0, chai_1.expect)(lib_1.util.unwrapElement(el)).to.eql(5);
        });
        it('should unwrap a wrapped element and prioritize W3C element identifier', function () {
            const el = { ELEMENT: 7, [W3C_WEB_ELEMENT_IDENTIFIER]: 6 };
            (0, chai_1.expect)(lib_1.util.unwrapElement(el)).to.eql(6);
        });
    });
    describe('wrapElement', function () {
        it('should include ELEMENT and w3c element', function () {
            (0, chai_1.expect)(lib_1.util.wrapElement(123)).to.eql({
                [lib_1.util.W3C_WEB_ELEMENT_IDENTIFIER]: 123,
                ELEMENT: 123,
            });
        });
    });
    describe('toReadableSizeString', function () {
        it('should fail if cannot convert to Bytes', function () {
            (0, chai_1.expect)(() => lib_1.util.toReadableSizeString('asdasd')).to.throw(/Cannot convert/);
        });
        it('should properly convert to Bytes', function () {
            (0, chai_1.expect)(lib_1.util.toReadableSizeString(0)).to.equal('0 B');
        });
        it('should properly convert to KBytes', function () {
            (0, chai_1.expect)(lib_1.util.toReadableSizeString((2048 + 12))).to.equal('2.01 KB');
        });
        it('should properly convert to MBytes', function () {
            (0, chai_1.expect)(lib_1.util.toReadableSizeString((1024 * 1024 * 3 + 1024 * 10))).to.equal('3.01 MB');
        });
        it('should properly convert to GBytes', function () {
            (0, chai_1.expect)(lib_1.util.toReadableSizeString((1024 * 1024 * 1024 * 5))).to.equal('5.00 GB');
        });
    });
    describe('filterObject', function () {
        describe('with undefined predicate', function () {
            it('should filter out undefineds', function () {
                const obj = { a: 'a', b: 'b', c: undefined };
                (0, chai_1.expect)(lib_1.util.filterObject(obj)).to.eql({ a: 'a', b: 'b' });
            });
            it('should leave nulls alone', function () {
                const obj = { a: 'a', b: 'b', c: null };
                (0, chai_1.expect)(lib_1.util.filterObject(obj)).to.eql({ a: 'a', b: 'b', c: null });
            });
        });
        describe('with value predicate', function () {
            it('should filter elements by their value', function () {
                const obj = { a: 'a', b: 'b', c: 'c', d: 'a' };
                (0, chai_1.expect)(lib_1.util.filterObject(obj, 'a')).to.eql({ a: 'a', d: 'a' });
            });
        });
        describe('with function predicate', function () {
            it('should filter elements', function () {
                const obj = { a: 'a', b: 'b', c: 'c' };
                (0, chai_1.expect)(lib_1.util.filterObject(obj, (v) => v === 'a' || v === 'c')).to.eql({
                    a: 'a',
                    c: 'c',
                });
            });
        });
    });
    describe('isSubPath', function () {
        it('should detect simple subpath', function () {
            (0, chai_1.expect)(lib_1.util.isSubPath('/root/some', '/root')).to.be.true;
        });
        it('should detect complex subpath', function () {
            (0, chai_1.expect)(lib_1.util.isSubPath('/root/some/other/../../.', '/root')).to.be.true;
        });
        it('should detect subpath ending with a slash', function () {
            (0, chai_1.expect)(lib_1.util.isSubPath('/root/some/', '/root')).to.be.true;
        });
        it('should detect if a path is not a subpath', function () {
            (0, chai_1.expect)(lib_1.util.isSubPath('/root/some//../..', '/root')).to.be.false;
        });
        it('should throw if any of the given paths is not absolute', function () {
            (0, chai_1.expect)(() => lib_1.util.isSubPath('some/..', '/root')).to.throw(/absolute/);
        });
    });
    describe('isSameDestination', function () {
        let path1;
        let path2;
        let tmpDir;
        before(async function () {
            tmpDir = await lib_1.tempDir.openDir();
            path1 = node_path_1.default.resolve(tmpDir, 'path1.txt');
            path2 = node_path_1.default.resolve(tmpDir, 'path2.txt');
            for (const p of [path1, path2]) {
                await lib_1.fs.writeFile(p, p, 'utf8');
            }
        });
        after(async function () {
            await lib_1.fs.rimraf(tmpDir);
        });
        it('should match paths to the same file/folder', async function () {
            (0, chai_1.expect)(await lib_1.util.isSameDestination(path1, node_path_1.default.resolve(tmpDir, '..', node_path_1.default.basename(tmpDir), node_path_1.default.basename(path1)))).to.be.true;
        });
        it('should not match paths if they point to non existing items', async function () {
            (0, chai_1.expect)(await lib_1.util.isSameDestination(path1, 'blabla')).to.be.false;
        });
        it('should not match paths to different files', async function () {
            (0, chai_1.expect)(await lib_1.util.isSameDestination(path1, path2)).to.be.false;
        });
    });
    describe('compareVersions', function () {
        it('should compare two correct version numbers', function () {
            (0, chai_1.expect)(lib_1.util.compareVersions('10.0', '<', '11.0')).to.eql(true);
            (0, chai_1.expect)(lib_1.util.compareVersions('11.0', '>=', '11.0')).to.eql(true);
            (0, chai_1.expect)(lib_1.util.compareVersions('11.0', '==', '11.0')).to.eql(true);
            (0, chai_1.expect)(lib_1.util.compareVersions('13.10', '>', '13.5')).to.eql(true);
            (0, chai_1.expect)(lib_1.util.compareVersions('11.1', '!=', '11.10')).to.eql(true);
            (0, chai_1.expect)(lib_1.util.compareVersions('12.0', '<', 10)).to.eql(false);
        });
        it('should throw if any of version arguments is invalid', function () {
            (0, chai_1.expect)(() => lib_1.util.compareVersions(undefined, '<', '11.0')).to.throw();
            (0, chai_1.expect)(() => lib_1.util.compareVersions('11.0', '==', null)).to.throw();
        });
        it('should throw if comparison operator is unsupported', function () {
            (0, chai_1.expect)(() => lib_1.util.compareVersions('12.0', 'abc', 10)).to.throw();
        });
    });
    describe('quote', function () {
        it('should quote a string with a space', function () {
            (0, chai_1.expect)(lib_1.util.quote(['a', 'b', 'c d'])).to.eql("a b 'c d'");
        });
        it('should escape double quotes', function () {
            (0, chai_1.expect)(lib_1.util.quote(['a', 'b', `it's a "neat thing"`])).to.eql(`a b "it's a \\"neat thing\\""`);
        });
        it("should escape $ ` and '", function () {
            (0, chai_1.expect)(lib_1.util.quote(['$', '`', `'`])).to.eql('\\$ \\` "\'"');
        });
        it('should handle empty array', function () {
            (0, chai_1.expect)(lib_1.util.quote([])).to.eql('');
        });
        it('should quote a string with newline', function () {
            (0, chai_1.expect)(lib_1.util.quote(['a\nb'])).to.eql(`'a\nb'`);
        });
        it('should stringify booleans', function () {
            (0, chai_1.expect)(lib_1.util.quote(['a', 1, true, false])).to.eql('a 1 true false');
        });
        it('should stringify null and undefined', function () {
            (0, chai_1.expect)(lib_1.util.quote(['a', 1, null, undefined])).to.eql('a 1 null undefined');
        });
    });
    describe('pluralize', function () {
        it('should pluralize a string', function () {
            (0, chai_1.expect)(lib_1.util.pluralize('word', 2)).to.eql('words');
        });
        it('should pluralize a string and prepend the number through boolean', function () {
            (0, chai_1.expect)(lib_1.util.pluralize('word', 2, true)).to.eql('2 words');
        });
        it('should pluralize a string and prepend the number through options', function () {
            (0, chai_1.expect)(lib_1.util.pluralize('word', 2, { inclusive: true })).to.eql('2 words');
        });
    });
    describe('memoize', function () {
        it('should memoize using first argument by default', function () {
            let callCount = 0;
            const fn = lib_1.util.memoize((value) => {
                callCount += 1;
                return value * 2;
            });
            (0, chai_1.expect)(fn(2)).to.equal(4);
            (0, chai_1.expect)(fn(2)).to.equal(4);
            (0, chai_1.expect)(callCount).to.equal(1);
        });
        it('should memoize by first argument only', function () {
            let callCount = 0;
            const fn = lib_1.util.memoize((a, b) => {
                callCount += 1;
                return a + b;
            });
            (0, chai_1.expect)(fn(1, 2)).to.equal(3);
            (0, chai_1.expect)(fn(1, 999)).to.equal(3);
            (0, chai_1.expect)(callCount).to.equal(1);
        });
        it('should memoize using a custom resolver', function () {
            let callCount = 0;
            const fn = lib_1.util.memoize((a, b) => {
                callCount += 1;
                return a + b;
            }, (_a, b) => b);
            (0, chai_1.expect)(fn(1, 2)).to.equal(3);
            (0, chai_1.expect)(fn(999, 2)).to.equal(3);
            (0, chai_1.expect)(callCount).to.equal(1);
        });
        it('should use resolver keys to isolate cache entries', function () {
            let callCount = 0;
            const fn = lib_1.util.memoize((value) => {
                callCount += 1;
                return value * 10;
            }, (value) => value % 2);
            (0, chai_1.expect)(fn(2)).to.equal(20);
            (0, chai_1.expect)(fn(4)).to.equal(20);
            (0, chai_1.expect)(fn(3)).to.equal(30);
            (0, chai_1.expect)(fn(5)).to.equal(30);
            (0, chai_1.expect)(callCount).to.equal(2);
        });
        it('should preserve this for resolver and wrapped function', function () {
            const obj = {
                prefix: 'ctx',
                calls: 0,
                fn: lib_1.util.memoize(function (value) {
                    this.calls += 1;
                    return `${this.prefix}:${value}`;
                }, function (value) {
                    return `${this.prefix}-${value}`;
                }),
            };
            (0, chai_1.expect)(obj.fn(1)).to.equal('ctx:1');
            (0, chai_1.expect)(obj.fn(1)).to.equal('ctx:1');
            (0, chai_1.expect)(obj.calls).to.equal(1);
        });
    });
    describe('isPlainObject', function () {
        it('should return true for plain objects', function () {
            (0, chai_1.expect)(lib_1.util.isPlainObject({})).to.be.true;
            (0, chai_1.expect)(lib_1.util.isPlainObject(Object.create(null))).to.be.true;
        });
        it('should return false for non-plain objects', function () {
            (0, chai_1.expect)(lib_1.util.isPlainObject([])).to.be.false;
            (0, chai_1.expect)(lib_1.util.isPlainObject(new Date())).to.be.false;
            (0, chai_1.expect)(lib_1.util.isPlainObject(null)).to.be.false;
        });
        it('should match lodash behavior for edge cases', function () {
            const spoofed = { a: 1, [Symbol.toStringTag]: 'Custom' };
            (0, chai_1.expect)(lib_1.util.isPlainObject(spoofed)).to.be.true;
            function CustomCtor() {
                this.a = 1;
            }
            const withCustomCtorOnProto = Object.create({ constructor: CustomCtor });
            (0, chai_1.expect)(lib_1.util.isPlainObject(withCustomCtorOnProto)).to.be.false;
        });
    });
    describe('isEmpty', function () {
        it('should handle strings and arrays', function () {
            (0, chai_1.expect)(lib_1.util.isEmpty('')).to.be.true;
            (0, chai_1.expect)(lib_1.util.isEmpty('x')).to.be.false;
            (0, chai_1.expect)(lib_1.util.isEmpty([])).to.be.true;
            (0, chai_1.expect)(lib_1.util.isEmpty([1])).to.be.false;
        });
        it('should handle objects and collections', function () {
            (0, chai_1.expect)(lib_1.util.isEmpty({})).to.be.true;
            (0, chai_1.expect)(lib_1.util.isEmpty({ a: 1 })).to.be.false;
            (0, chai_1.expect)(lib_1.util.isEmpty(new Map())).to.be.true;
            (0, chai_1.expect)(lib_1.util.isEmpty(new Set([1]))).to.be.false;
        });
        it('should handle non-plain objects with enumerable own properties', function () {
            class Thing {
            }
            const emptyInstance = new Thing();
            const nonEmptyInstance = new Thing();
            nonEmptyInstance.a = 1;
            (0, chai_1.expect)(lib_1.util.isEmpty(emptyInstance)).to.be.true;
            (0, chai_1.expect)(lib_1.util.isEmpty(nonEmptyInstance)).to.be.false;
            const fn = () => undefined;
            fn.x = 1;
            (0, chai_1.expect)(lib_1.util.isEmpty(fn)).to.be.false;
        });
    });
    describe('isEqual', function () {
        it('should deeply compare nested objects', function () {
            (0, chai_1.expect)(lib_1.util.isEqual({ a: [1, { b: 'c' }] }, { a: [1, { b: 'c' }] })).to.be.true;
            (0, chai_1.expect)(lib_1.util.isEqual({ a: [1, { b: 'c' }] }, { a: [1, { b: 'd' }] })).to.be.false;
        });
        it('should compare special values and typed objects', function () {
            (0, chai_1.expect)(lib_1.util.isEqual(NaN, NaN)).to.be.true;
            (0, chai_1.expect)(lib_1.util.isEqual(new Date('2020-01-01'), new Date('2020-01-01'))).to.be.true;
            (0, chai_1.expect)(lib_1.util.isEqual(/abc/gi, /abc/gi)).to.be.true;
            (0, chai_1.expect)(lib_1.util.isEqual(Buffer.from('a'), Buffer.from('a'))).to.be.true;
        });
        it('should compare maps and sets', function () {
            const entries = [
                ['a', 1],
                ['b', { c: 2 }],
            ];
            (0, chai_1.expect)(lib_1.util.isEqual(new Map(entries), new Map(entries))).to.be.true;
            (0, chai_1.expect)(lib_1.util.isEqual(new Set([1, 2]), new Set([2, 1]))).to.be.true;
            (0, chai_1.expect)(lib_1.util.isEqual(new Set([1, 2]), new Set([2, 3]))).to.be.false;
        });
        it('should compare functions by identity only', function () {
            const fn1 = () => 1;
            const fn2 = () => 1;
            fn1.x = 1;
            fn2.x = 1;
            (0, chai_1.expect)(lib_1.util.isEqual(fn1, fn1)).to.be.true;
            (0, chai_1.expect)(lib_1.util.isEqual(fn1, fn2)).to.be.false;
        });
        it('should ignore non-enumerable own properties', function () {
            const left = { a: 1 };
            const right = { a: 1 };
            Object.defineProperty(left, 'hidden', { value: 1, enumerable: false });
            Object.defineProperty(right, 'hidden', { value: 2, enumerable: false });
            (0, chai_1.expect)(lib_1.util.isEqual(left, right)).to.be.true;
        });
        it('should compare errors and boxed symbols like lodash', function () {
            (0, chai_1.expect)(lib_1.util.isEqual(new Error('boom'), new Error('boom'))).to.be.true;
            (0, chai_1.expect)(lib_1.util.isEqual(new Error('boom'), new Error('kaboom'))).to.be.false;
            (0, chai_1.expect)(lib_1.util.isEqual(Object(Symbol.for('x')), Object(Symbol.for('x')))).to.be.true;
            (0, chai_1.expect)(lib_1.util.isEqual(Object(Symbol.for('x')), Object(Symbol.for('y')))).to.be.false;
        });
    });
    describe('escapeRegExp', function () {
        it('should escape regexp metacharacters', function () {
            (0, chai_1.expect)(lib_1.util.escapeRegExp('a+b*c?.(x)[y]{z}|^$\\')).to.equal('a\\+b\\*c\\?\\.\\(x\\)\\[y\\]\\{z\\}\\|\\^\\$\\\\');
        });
    });
    describe('uniq', function () {
        it('should return a duplicate-free array preserving order', function () {
            (0, chai_1.expect)(lib_1.util.uniq([1, 2, 1, 3, 2])).to.eql([1, 2, 3]);
        });
    });
    describe('truncateString', function () {
        it('should not change short strings', function () {
            (0, chai_1.expect)(lib_1.util.truncateString('short')).to.equal('short');
        });
        it('should truncate with default options', function () {
            const src = 'abcdefghijklmnopqrstuvwxyz0123456789';
            (0, chai_1.expect)(lib_1.util.truncateString(src)).to.equal('abcdefghijklmnopqrstuvwxyz012…');
        });
        it('should support numeric length shorthand', function () {
            (0, chai_1.expect)(lib_1.util.truncateString('abcdefghijklmnopqrstuvwxyz', 10)).to.equal('abcdefghi…');
        });
        it('should support custom omission', function () {
            (0, chai_1.expect)(lib_1.util.truncateString('abcdefghijklmnopqrstuvwxyz', { length: 10, omission: '..' })).to.equal('abcdefgh..');
        });
        it('should handle non-string values safely', function () {
            (0, chai_1.expect)(() => lib_1.util.truncateString(undefined)).not.to.throw();
            (0, chai_1.expect)(() => lib_1.util.truncateString(null)).not.to.throw();
            (0, chai_1.expect)(lib_1.util.truncateString(undefined)).to.equal('');
            (0, chai_1.expect)(lib_1.util.truncateString(null)).to.equal('');
            (0, chai_1.expect)(lib_1.util.truncateString(123456, 5)).to.equal('1234…');
            (0, chai_1.expect)(lib_1.util.truncateString({ a: 1 }, 8)).to.equal('[object…');
            (0, chai_1.expect)(lib_1.util.truncateString(-0)).to.equal('-0');
        });
        it('should return omission if max length is too small', function () {
            (0, chai_1.expect)(lib_1.util.truncateString('hello world', 0)).to.equal('…');
        });
    });
});
//# sourceMappingURL=util.spec.js.map