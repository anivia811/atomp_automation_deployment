"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const plugin_1 = require("../../lib/plugin");
const { expect } = chai_1.default;
chai_1.default.use(chai_as_promised_1.default);
// Let's not use the actual FakePlugin because it runs a timer and we don't want to worry about
// needing to clean up timers so that unit test processes can exit!
class FakePlugin extends plugin_1.FakePlugin {
    _clockRunning = false;
}
class FakeExpress {
    routes = {};
    all(route, handler) {
        this.routes[route] = handler;
    }
    async get(route) {
        return await new Promise((resolve, reject) => {
            try {
                const res = {
                    send: resolve,
                };
                this.routes[route]({}, res);
            }
            catch (e) {
                reject(e);
            }
        });
    }
}
describe('fake plugin', function () {
    it('should exist', function () {
        expect(FakePlugin).to.exist;
    });
    it('should update an express app with a fake route', async function () {
        const app = new FakeExpress();
        await expect(app.get('/fake')).to.be.rejected;
        await FakePlugin.updateServer(app, {}, {});
        await expect(app.get('/fake')).to.eventually.eql(JSON.stringify({ fake: 'fakeResponse' }));
    });
    it('should wrap find element', async function () {
        const p = new FakePlugin('fake');
        await expect(p.findElement(() => Promise.resolve({ el: 'fakeEl' }), {}, 'arg1', 'arg2')).to.eventually.eql({
            el: 'fakeEl',
            fake: true,
        });
    });
    it('should handle page source', async function () {
        const p = new FakePlugin('fake');
        await expect(p.getPageSource(() => Promise.resolve(''), {}, 'arg1', 'arg2')).to.eventually.eql('<Fake>["arg1","arg2"]</Fake>');
    });
    it('should handle getFakeSessionData', async function () {
        const p = new FakePlugin('fake');
        await expect(p.getFakeSessionData(() => Promise.resolve(null), { fakeSessionData: 'hi' })).to.eventually.eql('hi');
        await expect(p.getFakeSessionData(() => Promise.resolve(null), {})).to.eventually.eql(null);
    });
    it('should handle setFakeSessionData', async function () {
        const p = new FakePlugin('fake');
        const driver = {};
        await expect(p.setFakeSessionData(() => Promise.resolve(null), driver, 'foobar')).to.eventually.eql(null);
        await expect(p.getFakeSessionData(() => Promise.resolve(null), driver)).to.eventually.eql('foobar');
    });
});
//# sourceMappingURL=plugin.spec.js.map