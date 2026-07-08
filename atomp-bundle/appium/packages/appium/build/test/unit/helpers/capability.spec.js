"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const capability_1 = require("../../../lib/helpers/capability");
const helpers_1 = require("../../helpers");
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
describe('helpers/capability', function () {
    beforeEach(async function () {
        (0, chai_1.use)(chai_as_promised_1.default);
    });
    describe('parseCapsForInnerDriver()', function () {
        it('should return an error if only JSONWP provided', function () {
            const res = (0, capability_1.parseCapsForInnerDriver)(helpers_1.BASE_CAPS);
            (0, chai_1.expect)('error' in res && res.error).to.be.ok;
            (0, chai_1.expect)(res.error.message).to.match(/W3C/);
        });
        it('should return W3C caps unchanged if only W3C caps were provided', function () {
            const { desiredCaps, processedW3CCapabilities } = (0, capability_1.parseCapsForInnerDriver)(helpers_1.W3C_CAPS);
            (0, chai_1.expect)(desiredCaps).to.deep.equal(helpers_1.BASE_CAPS);
            (0, chai_1.expect)(processedW3CCapabilities).to.deep.equal(helpers_1.W3C_CAPS);
        });
        it('should include default capabilities in results', function () {
            const defaultW3CCaps = {
                'appium:foo': 'bar',
                'appium:baz': 'bla',
            };
            const expectedDefaultCaps = {
                foo: 'bar',
                baz: 'bla',
            };
            const { desiredCaps, processedW3CCapabilities } = (0, capability_1.parseCapsForInnerDriver)(helpers_1.W3C_CAPS, {}, defaultW3CCaps);
            (0, chai_1.expect)(desiredCaps).to.deep.equal({
                ...expectedDefaultCaps,
                ...helpers_1.BASE_CAPS,
            });
            (0, chai_1.expect)(processedW3CCapabilities.alwaysMatch).to.deep.equal({
                ...(0, capability_1.insertAppiumPrefixes)(expectedDefaultCaps),
                ...(0, capability_1.insertAppiumPrefixes)(helpers_1.BASE_CAPS),
            });
        });
        it('should allow valid default capabilities', function () {
            const res = (0, capability_1.parseCapsForInnerDriver)(helpers_1.W3C_CAPS, {}, {
                'appium:foo': 'bar2',
            });
            (0, chai_1.expect)(res.processedW3CCapabilities.alwaysMatch['appium:foo']).to.eql('bar2');
        });
        it('should not allow invalid default capabilities', function () {
            const res = (0, capability_1.parseCapsForInnerDriver)(helpers_1.W3C_CAPS, {}, {
                foo: 'bar',
                'appium:foo2': 'bar2',
            });
            const errRes = res;
            (0, chai_1.expect)(errRes.error.jsonwpCode).to.eql(61);
            (0, chai_1.expect)(errRes.error.error).to.eql('invalid argument');
            (0, chai_1.expect)(errRes.error.w3cStatus).to.eql(400);
        });
        it('should reject if W3C caps are not passing constraints', function () {
            const res = (0, capability_1.parseCapsForInnerDriver)(helpers_1.W3C_CAPS, {
                hello: { presence: true },
            });
            const err = res.error;
            (0, chai_1.expect)(err.message).to.match(/required/);
            (0, chai_1.expect)(err).to.be.instanceOf(Error);
        });
        it('should only accept W3C caps that have passing constraints', function () {
            const w3cCaps = {
                ...helpers_1.W3C_CAPS,
                firstMatch: [{ foo: 'bar' }, { 'appium:hello': 'world' }],
            };
            const res = (0, capability_1.parseCapsForInnerDriver)(w3cCaps, { hello: { presence: true } });
            const error = res.error;
            (0, chai_1.expect)(error.jsonwpCode).to.eql(61);
            (0, chai_1.expect)(error.error).to.eql('invalid argument');
            (0, chai_1.expect)(error.w3cStatus).to.eql(400);
        });
        it('should add appium prefixes to W3C caps that are not standard in W3C', function () {
            const res = (0, capability_1.parseCapsForInnerDriver)({
                alwaysMatch: {
                    platformName: 'Fake',
                    propertyName: 'PROP_NAME',
                },
                firstMatch: [{}],
            });
            (0, chai_1.expect)(res.error.error).to.includes('invalid argument');
        });
    });
    describe('removeAppiumPrefixes()', function () {
        it('should remove appium prefixes from cap names', function () {
            (0, chai_1.expect)((0, capability_1.removeAppiumPrefixes)({
                'appium:cap1': 'value1',
                'ms:cap2': 'value2',
                someCap: 'someCap',
            })).to.eql({
                cap1: 'value1',
                'ms:cap2': 'value2',
                someCap: 'someCap',
            });
        });
    });
    describe('insertAppiumPrefixes()', function () {
        it('should apply prefixes to non-standard capabilities', function () {
            (0, chai_1.expect)((0, capability_1.insertAppiumPrefixes)({
                someCap: 'someCap',
            })).to.deep.equal({
                'appium:someCap': 'someCap',
            });
        });
        it('should not apply prefixes to standard capabilities', function () {
            (0, chai_1.expect)((0, capability_1.insertAppiumPrefixes)({
                browserName: 'BrowserName',
                platformName: 'PlatformName',
            })).to.deep.equal({
                browserName: 'BrowserName',
                platformName: 'PlatformName',
            });
        });
        it('should not apply prefixes to capabilities that already have a prefix', function () {
            (0, chai_1.expect)((0, capability_1.insertAppiumPrefixes)({
                'appium:someCap': 'someCap',
                'moz:someOtherCap': 'someOtherCap',
            })).to.deep.equal({
                'appium:someCap': 'someCap',
                'moz:someOtherCap': 'someOtherCap',
            });
        });
        it('should apply prefixes to non-prefixed, non-standard capabilities; should not apply prefixes to any other capabilities', function () {
            (0, chai_1.expect)((0, capability_1.insertAppiumPrefixes)({
                'appium:someCap': 'someCap',
                'moz:someOtherCap': 'someOtherCap',
                browserName: 'BrowserName',
                platformName: 'PlatformName',
                someOtherCap: 'someOtherCap',
                yetAnotherCap: 'yetAnotherCap',
            })).to.deep.equal({
                'appium:someCap': 'someCap',
                'moz:someOtherCap': 'someOtherCap',
                browserName: 'BrowserName',
                platformName: 'PlatformName',
                'appium:someOtherCap': 'someOtherCap',
                'appium:yetAnotherCap': 'yetAnotherCap',
            });
        });
    });
    describe('pullSettings()', function () {
        it('should pull settings from caps', function () {
            const caps = {
                platformName: 'foo',
                browserName: 'bar',
                'settings[settingName]': 'baz',
                'settings[settingName2]': 'baz2',
            };
            const settings = (0, capability_1.pullSettings)(caps);
            (0, chai_1.expect)(settings).to.eql({
                settingName: 'baz',
                settingName2: 'baz2',
            });
            (0, chai_1.expect)(caps).to.eql({
                platformName: 'foo',
                browserName: 'bar',
            });
        });
        it('should pull settings dict if object values are present in caps', function () {
            const caps = {
                platformName: 'foo',
                browserName: 'bar',
                'settings[settingName]': { key: 'baz' },
            };
            const settings = (0, capability_1.pullSettings)(caps);
            (0, chai_1.expect)(settings).to.eql({
                settingName: { key: 'baz' },
            });
            (0, chai_1.expect)(caps).to.eql({
                platformName: 'foo',
                browserName: 'bar',
            });
        });
        it('should pull empty dict if no settings are present in caps', function () {
            const caps = {
                platformName: 'foo',
                browserName: 'bar',
                'setting[settingName]': 'baz',
            };
            const settings = (0, capability_1.pullSettings)(caps);
            (0, chai_1.expect)(settings).to.eql({});
            (0, chai_1.expect)(caps).to.eql({
                platformName: 'foo',
                browserName: 'bar',
                'setting[settingName]': 'baz',
            });
        });
        it('should pull empty dict if caps are empty', function () {
            const caps = {};
            const settings = (0, capability_1.pullSettings)(caps);
            (0, chai_1.expect)(settings).to.eql({});
            (0, chai_1.expect)(caps).to.eql({});
        });
        it('should pull combined settings', function () {
            const caps = {
                platformName: 'foo',
                browserName: 'bar',
                'appium:settings[foo]': 'baz2',
                'appium:settings': {
                    foo: 'baz',
                    yolo: 'bar',
                },
            };
            const settings = (0, capability_1.pullSettings)(caps);
            (0, chai_1.expect)(settings).to.eql({
                foo: 'baz2',
                yolo: 'bar',
            });
            (0, chai_1.expect)(caps).to.eql({
                platformName: 'foo',
                browserName: 'bar',
            });
        });
    });
});
//# sourceMappingURL=capability.spec.js.map