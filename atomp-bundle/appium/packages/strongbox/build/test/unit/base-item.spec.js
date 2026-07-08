"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const node_1 = __importDefault(require("rewiremock/node"));
const sinon_1 = require("sinon");
describe('Strongbox', function () {
    let sandbox;
    let MockFs = {};
    const DATA_DIR = node_path_1.default.resolve(node_path_1.default.sep, 'some', 'dir');
    // note to self: looks like this is safe to do before the rewiremock.proxy call
    let BaseItem;
    let expect;
    before(async function () {
        const chai = await import('chai');
        const chaiAsPromised = await import('chai-as-promised');
        chai.use(chaiAsPromised.default);
        chai.should();
        expect = chai.expect;
    });
    beforeEach(function () {
        sandbox = (0, sinon_1.createSandbox)();
        ({ BaseItem } = node_1.default.proxy(() => require('../../lib'), (r) => ({
            // all of these props are async functions
            'node:fs/promises': r
                .mockThrough((prop) => {
                MockFs = { ...MockFs, [prop]: sandbox.stub().resolves() };
                return MockFs[prop];
            })
                .dynamic(), // this allows us to change the mock behavior on-the-fly
            'env-paths': sandbox.stub().returns({ data: DATA_DIR }),
        })));
    });
    describe('BaseItem', function () {
        describe('constructor', function () {
            it('should set the id property based on the parent container', function () {
                const item = new BaseItem('foo', { container: DATA_DIR });
                expect(item.id).to.equal(node_path_1.default.join(DATA_DIR, 'foo'));
            });
        });
        describe('method', function () {
            let item;
            beforeEach(function () {
                item = new BaseItem('foo', { container: DATA_DIR });
            });
            describe('clear()', function () {
                it('should remove the item from the filesystem', async function () {
                    await item.clear();
                    expect(MockFs.unlink.calledWith(item.id)).to.be.true;
                });
                describe('if the item does not exist', function () {
                    beforeEach(function () {
                        MockFs.unlink.rejects({ code: 'ENOENT' });
                    });
                    it('should not reject', async function () {
                        await expect(item.clear()).to.not.be.rejected;
                    });
                });
                describe('if something else goes wrong', function () {
                    beforeEach(function () {
                        MockFs.unlink.rejects(new Error('ugh'));
                    });
                    it('should reject', async function () {
                        await expect(item.clear()).to.be.rejectedWith(Error, 'ugh');
                    });
                });
            });
            describe('read()', function () {
                beforeEach(function () {
                    MockFs.readFile.resolves('skunk');
                });
                it('should read the item from the fileystem', function () {
                    expect(item.read()).to.eventually.equal('skunk');
                });
                it('should set the item value to the read value', async function () {
                    await item.read();
                    expect(item.value).to.equal('skunk');
                });
            });
            describe('write()', function () {
                beforeEach(async function () {
                    await item.write('bar');
                });
                it('should write the new item value to the filesystem', async function () {
                    expect(MockFs.writeFile.calledWith(item.id, 'bar')).to.be.true;
                });
                it('should create the container', function () {
                    expect(MockFs.mkdir.calledWith(node_path_1.default.dirname(item.id), { recursive: true })).to.be.true;
                });
            });
        });
    });
});
//# sourceMappingURL=base-item.spec.js.map