"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const node_path_1 = __importDefault(require("node:path"));
const constants_1 = require("../../../lib/constants");
const helpers_1 = require("../../helpers");
const mocks_1 = require("./mocks");
const { expect } = chai_1.default;
chai_1.default.use(chai_as_promised_1.default);
describe('package-changed', function () {
    let packageDidChange;
    let sandbox;
    let MockPackageChanged;
    let MockAppiumSupport;
    beforeEach(function () {
        ({ MockPackageChanged, MockAppiumSupport, sandbox } = (0, mocks_1.initMocks)());
        ({ packageDidChange } = helpers_1.rewiremock.proxy(() => require('../../../lib/utils/package-changed'), {
            '../../../lib/utils/is-package-changed': MockPackageChanged,
            '@appium/support': MockAppiumSupport,
        }));
    });
    afterEach(function () {
        sandbox.restore();
    });
    describe('packageDidChange()', function () {
        describe('when called without an `appiumHome`', function () {
            it('should reject', async function () {
                await expect(packageDidChange()).to.be.rejectedWith(TypeError);
            });
        });
        it('it should attempt to create the parent dir for the hash file', async function () {
            await packageDidChange('/some/path');
            expect(MockAppiumSupport.fs.mkdirp.calledWith(node_path_1.default.dirname(node_path_1.default.join('/some/path', constants_1.PKG_HASHFILE_RELATIVE_PATH)))).to.be.true;
        });
        it('should call `isPackageChanged` with a cwd and relative path to hash file', async function () {
            await packageDidChange('/some/path');
            expect(MockPackageChanged.isPackageChanged.calledWith({
                cwd: '/some/path',
                hashFilename: constants_1.PKG_HASHFILE_RELATIVE_PATH,
            })).to.be.true;
        });
        describe('when it cannot create the parent dir', function () {
            it('should reject', async function () {
                MockAppiumSupport.fs.mkdirp.rejects(new Error('some error'));
                await expect(packageDidChange('/some/path')).to.be.rejectedWith(Error, /could not create the directory/i);
            });
        });
        describe('when the package has not changed per `isPackageChanged`', function () {
            beforeEach(function () {
                MockPackageChanged.isPackageChanged.resolves({
                    isChanged: false,
                    writeHash: MockPackageChanged.__writeHash,
                    hash: 'some-hash',
                    oldHash: 'some-old-hash',
                });
            });
            it('should resolve `false`', async function () {
                expect(await packageDidChange('/disneyland')).to.be.false;
            });
            it('should not write the hash file', async function () {
                await packageDidChange('/some/where');
                expect(MockPackageChanged.__writeHash.called).to.be.false;
            });
        });
        describe('when the package has changed per `isPackageChanged`', function () {
            it('should write the hash file', async function () {
                await packageDidChange('/some/where');
                expect(MockPackageChanged.__writeHash.calledOnce).to.be.true;
            });
            it('should resolve `true`', async function () {
                expect(await packageDidChange('/somewhere/else')).to.be.true;
            });
            describe('when it cannot write the hash file', function () {
                beforeEach(function () {
                    MockPackageChanged.__writeHash.throws(new Error('oh noes'));
                });
                it('should reject', async function () {
                    await expect(packageDidChange('/some/where')).to.be.rejectedWith(Error, /could not write hash file/i);
                });
            });
        });
    });
});
//# sourceMappingURL=package-changed.spec.js.map