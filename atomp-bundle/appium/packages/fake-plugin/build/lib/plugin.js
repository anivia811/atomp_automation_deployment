"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakePlugin = void 0;
const plugin_1 = require("appium/plugin");
const asyncbox_1 = require("asyncbox");
class FakePlugin extends plugin_1.BasePlugin {
    static newMethodMap = {
        '/session/:sessionId/fake_data': {
            GET: { command: 'getFakeSessionData', neverProxy: true },
            POST: {
                command: 'setFakeSessionData',
                payloadParams: { required: ['data'] },
                neverProxy: true,
            },
        },
        '/session/:sessionId/fakepluginargs': {
            GET: { command: 'getFakePluginArgs', neverProxy: true },
        },
    };
    static newBidiCommands = {
        'appium:fake': {
            getPluginThing: {
                command: 'getPluginThing',
            },
            setPluginThing: {
                command: 'setPluginThing',
                params: {
                    required: ['thing'],
                },
            },
            doSomeMath: {
                command: 'doSomeMath',
                params: {
                    required: ['num1', 'num2'],
                },
            },
            doSomeMath2: {
                command: 'doSomeMath2',
                params: {
                    required: ['num1', 'num2'],
                },
            },
        },
    };
    static executeMethodMap = {
        'fake: getThing': {
            command: 'getFakeThing',
        },
        'fake: plugMeIn': {
            command: 'plugMeIn',
            params: { required: ['socket'] },
        },
        'fake: getFakeDriverClockStatus': {
            command: 'getFakeDriverClockStatus',
        },
    };
    static _unexpectedData = null;
    _clockRunning = true;
    fakeThing;
    pluginThing = null;
    fakeDriverClockIsRunning = false;
    ipcPluginMath;
    constructor(name, cliArgs = {}) {
        super(name, cliArgs);
        this.fakeThing = 'PLUGIN_FAKE_THING';
        void this.startClock();
    }
    static fakeRoute(_req, res) {
        res.send(JSON.stringify({ fake: 'fakeResponse' }));
    }
    static unexpectedData(_req, res) {
        res.send(JSON.stringify(FakePlugin._unexpectedData));
        FakePlugin._unexpectedData = null;
    }
    static async updateServer(expressApp, _httpServer, cliArgs) {
        expressApp.all('/fake', FakePlugin.fakeRoute);
        expressApp.all('/unexpected', FakePlugin.unexpectedData);
        expressApp.all('/cliArgs', (req, res) => {
            res.send(JSON.stringify(cliArgs));
        });
    }
    async onIpcInit() {
        const clockSub = this.ipcSubscribe('clockLifecycle');
        clockSub.on('message', (message) => {
            this.fakeDriverClockIsRunning = message.data.running;
        });
        // subscribing to clockLifecycle doesn't tell us the current status if it started before this
        // constructor was called, so retrieve it
        const message = clockSub.getMessage();
        if (message) {
            this.fakeDriverClockIsRunning = message.data.running;
        }
        this.ipcPluginMath = this.ipcSubscribe('pluginMath');
    }
    async startClock() {
        while (this._clockRunning) {
            await (0, asyncbox_1.sleep)(250);
            this.eventEmitter.emit('bidiEvent', {
                method: 'appium:clock.currentTime',
                params: { time: Date.now() },
            });
        }
    }
    async doSomeMath(next, _driver, num1, num2) {
        const sum = await next();
        return num1 * num2 + sum;
    }
    async doSomeMath2(_next, _driver, num1, num2) {
        await (0, asyncbox_1.sleep)(1);
        const result = num1 * num2;
        if (this.ipcPluginMath) {
            await this.ipcPluginMath.publish(result);
        }
        return result;
    }
    async getFakeThing() {
        await (0, asyncbox_1.sleep)(1);
        return this.fakeThing;
    }
    async getPluginThing() {
        this.eventEmitter.emit('bidiEvent', {
            method: 'appium:fake.pluginThingRetrieved',
            params: {},
        });
        return this.pluginThing;
    }
    async setPluginThing(_next, _driver, thing) {
        this.pluginThing = thing;
    }
    async plugMeIn(_next, _driver, socket) {
        await (0, asyncbox_1.sleep)(1);
        return `Plugged in to ${socket}`;
    }
    async getFakePluginArgs() {
        await (0, asyncbox_1.sleep)(1);
        return this.cliArgs;
    }
    async getFakeDriverClockStatus() {
        return this.fakeDriverClockIsRunning;
    }
    async getPageSource(_next, _driver, ...args) {
        await (0, asyncbox_1.sleep)(10);
        return `<Fake>${JSON.stringify(args)}</Fake>`;
    }
    async findElement(next, _driver, ...args) {
        this.log.info(`Before findElement is run with args ${JSON.stringify(args)}`);
        const originalRes = await next();
        this.log.info('After findElement is run');
        originalRes.fake = true;
        return originalRes;
    }
    async getFakeSessionData(_next, driver) {
        await (0, asyncbox_1.sleep)(1);
        return driver.fakeSessionData ?? null;
    }
    async setFakeSessionData(_next, driver, ...args) {
        await (0, asyncbox_1.sleep)(1);
        driver.fakeSessionData = args[0];
        return null;
    }
    async getWindowHandle(next) {
        const handle = await next();
        return `<<${handle}>>`;
    }
    async onUnexpectedShutdown(_driver, cause) {
        this._clockRunning = false;
        FakePlugin._unexpectedData = `Session ended because ${cause}`;
    }
    async execute(next, driver, script, args) {
        return await this.executeMethod(next, driver, script, args);
    }
    async deleteSession(next) {
        this._clockRunning = false;
        return await next();
    }
}
exports.FakePlugin = FakePlugin;
//# sourceMappingURL=plugin.js.map