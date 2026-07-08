"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeDriver = void 0;
const asyncbox_1 = require("asyncbox");
const driver_1 = require("appium/driver");
const desired_caps_1 = require("./desired-caps");
const fake_app_1 = require("./fake-app");
const alertCommands = __importStar(require("./commands/alert"));
const contextsCommands = __importStar(require("./commands/contexts"));
const elementCommands = __importStar(require("./commands/element"));
const findCommands = __importStar(require("./commands/find"));
const generalCommands = __importStar(require("./commands/general"));
const new_bidi_commands_1 = require("./command-maps/new-bidi-commands");
const new_method_map_1 = require("./command-maps/new-method-map");
const execute_method_map_1 = require("./command-maps/execute-method-map");
/** Driver supporting a generic "fake thing" value (getFakeThing / setFakeThing). */
class FakeDriver extends driver_1.BaseDriver {
    static newBidiCommands = new_bidi_commands_1.NEW_BIDI_COMMANDS;
    static newMethodMap = new_method_map_1.NEW_METHOD_MAP;
    static executeMethodMap = execute_method_map_1.EXECUTE_METHOD_MAP;
    desiredCapConstraints = desired_caps_1.desiredCapConstraints;
    curContext;
    appModel;
    _proxyActive;
    shook;
    focusedElId;
    fakeThing;
    /** Next numeric id for new elements; keys in elMap are stringified. */
    maxElId;
    /** Map of element id (string) to FakeElement for this session. */
    elMap;
    /** Current document URL; set by bidiNavigate, returned by getUrl. */
    url = '';
    ipcClock;
    // Alert commands
    assertNoAlert = alertCommands.assertNoAlert;
    assertAlert = alertCommands.assertAlert;
    getAlertText = alertCommands.getAlertText;
    setAlertText = alertCommands.setAlertText;
    postAcceptAlert = alertCommands.postAcceptAlert;
    postDismissAlert = alertCommands.postDismissAlert;
    // Context commands
    getRawContexts = contextsCommands.getRawContexts;
    assertWebviewContext = contextsCommands.assertWebviewContext;
    getCurrentContext = contextsCommands.getCurrentContext;
    getContexts = contextsCommands.getContexts;
    setContext = contextsCommands.setContext;
    setFrame = contextsCommands.setFrame;
    // Element commands
    getElements = elementCommands.getElements;
    getElement = elementCommands.getElement;
    getName = elementCommands.getName;
    elementDisplayed = elementCommands.elementDisplayed;
    elementEnabled = elementCommands.elementEnabled;
    elementSelected = elementCommands.elementSelected;
    setValue = elementCommands.setValue;
    getText = elementCommands.getText;
    clear = elementCommands.clear;
    click = elementCommands.click;
    getAttribute = elementCommands.getAttribute;
    getElementRect = elementCommands.getElementRect;
    getSize = elementCommands.getSize;
    equalsElement = elementCommands.equalsElement;
    getCssProperty = elementCommands.getCssProperty;
    getLocation = elementCommands.getLocation;
    getLocationInView = elementCommands.getLocationInView;
    // Find commands
    getExistingElementForNode = findCommands.getExistingElementForNode;
    wrapNewEl = findCommands.wrapNewEl;
    findElOrEls = findCommands.findElOrEls;
    findElement = findCommands.findElement;
    findElements = findCommands.findElements;
    findElementFromElement = findCommands.findElementFromElement;
    findElementsFromElement = findCommands.findElementsFromElement;
    // General commands
    title = generalCommands.title;
    keys = generalCommands.keys;
    setGeoLocation = generalCommands.setGeoLocation;
    getGeoLocation = generalCommands.getGeoLocation;
    getPageSource = generalCommands.getPageSource;
    getOrientation = generalCommands.getOrientation;
    setOrientation = generalCommands.setOrientation;
    getScreenshot = generalCommands.getScreenshot;
    getWindowSize = generalCommands.getWindowSize;
    getWindowRect = generalCommands.getWindowRect;
    performActions = generalCommands.performActions;
    releaseActions = generalCommands.releaseActions;
    getLog = generalCommands.getLog;
    mobileShake = generalCommands.mobileShake;
    doubleClick = generalCommands.doubleClick;
    execute = generalCommands.execute;
    fakeAddition = generalCommands.fakeAddition;
    getUrl = generalCommands.getUrl;
    bidiNavigate = generalCommands.bidiNavigate;
    getLastPluginMath = generalCommands.getLastPluginMath;
    lastPluginMath;
    /** If set, Bidi connections are proxied to this URL instead of handling locally. */
    _bidiProxyUrl;
    _clockRunning = false;
    ipcFakeThing;
    constructor(opts = {}, shouldValidateCaps = true) {
        super(opts, shouldValidateCaps);
        this.curContext = 'NATIVE_APP';
        this.elMap = {};
        this.focusedElId = null;
        this.maxElId = 0;
        this.fakeThing = null;
        this._proxyActive = false;
        this.shook = false;
        this.appModel = new fake_app_1.FakeApp();
        this._bidiProxyUrl = null;
        this.lastPluginMath = null;
    }
    get bidiProxyUrl() {
        return this._bidiProxyUrl;
    }
    get driverData() {
        return {
            isUnique: !!this.caps.uniqueApp,
        };
    }
    static fakeRoute(_req, res) {
        res.send(JSON.stringify({ fakedriver: 'fakeResponse' }));
    }
    static async updateServer(expressApp, _httpServer, cliArgs) {
        expressApp.all('/fakedriver', FakeDriver.fakeRoute);
        expressApp.all('/fakedriverCliArgs', (_req, res) => {
            res.send(JSON.stringify(cliArgs));
        });
    }
    async onIpcInit() {
        const fakeMathSub = this.ipcSubscribe('pluginMath');
        fakeMathSub.on('message', (message) => {
            this.log.info(`A connected plugin did some math with result ${message.data}`);
            this.lastPluginMath = { pluginName: message.publisher, result: message.data };
        });
        this.ipcFakeThing = this.ipcSubscribe('fakeThing');
        this.ipcClock = this.ipcSubscribe('clockLifecycle');
        await this.publishClockStatus();
    }
    proxyActive() {
        return this._proxyActive;
    }
    canProxy() {
        return true;
    }
    proxyReqRes(req, res) {
        res.set('content-type', 'application/json');
        const resBodyObj = {
            value: 'proxied via proxyReqRes',
            sessionId: null,
        };
        const match = req.originalUrl.match(/\/session\/([^/]+)/);
        resBodyObj.sessionId = match ? match[1] : null;
        res.status(200).send(JSON.stringify(resBodyObj));
    }
    async proxyCommand() {
        return 'proxied via proxyCommand';
    }
    /**
     * Create session and load fake app XML from caps.app.
     * Starts clock event emitter if caps.runClock is true.
     */
    async createSession(w3cCapabilities1, w3cCapabilities2, w3cCapabilities3, driverData = []) {
        for (const d of driverData) {
            if (d.isUnique) {
                throw new driver_1.errors.SessionNotCreatedError('Cannot start session; another ' +
                    'unique session is in progress that requires all resources');
            }
        }
        const [sessionId, caps] = (await super.createSession(w3cCapabilities1, w3cCapabilities2, w3cCapabilities3, driverData));
        this.caps = caps;
        await this.appModel.loadApp(caps.app);
        if (this.caps.runClock) {
            void this.startClock();
        }
        return [sessionId, caps];
    }
    async deleteSession(sessionId) {
        await this.stopClock();
        return await super.deleteSession(sessionId);
    }
    async getWindowHandle() {
        return '1';
    }
    async getWindowHandles() {
        return ['1'];
    }
    async getFakeThing() {
        await (0, asyncbox_1.sleep)(1);
        return this.fakeThing;
    }
    async setFakeThing(thing) {
        await (0, asyncbox_1.sleep)(1);
        this.fakeThing = thing;
        if (this.ipcFakeThing) {
            await this.ipcFakeThing.publish(thing);
        }
        return null;
    }
    async getFakeDriverArgs() {
        await (0, asyncbox_1.sleep)(1);
        return this.cliArgs;
    }
    /** TODO: track deprecated commands when called and return their names. */
    async getDeprecatedCommandsCalled() {
        await (0, asyncbox_1.sleep)(1);
        return [];
    }
    async callDeprecatedCommand() {
        await (0, asyncbox_1.sleep)(1);
    }
    async doSomeMath(num1, num2) {
        await (0, asyncbox_1.sleep)(1);
        return num1 + num2;
    }
    async doSomeMath2(num1, num2) {
        await (0, asyncbox_1.sleep)(1);
        return num1 + num2;
    }
    async fakeStartClock() {
        void this.startClock();
    }
    async fakeStopClock() {
        await this.stopClock();
    }
    async startClock() {
        this._clockRunning = true;
        try {
            await this.publishClockStatus();
        }
        catch (e) {
            this.log.error(e);
        }
        while (this._clockRunning) {
            await (0, asyncbox_1.sleep)(500);
            try {
                this.eventEmitter.emit('bidiEvent', {
                    method: 'appium:clock.currentTime',
                    params: { time: Date.now() },
                });
            }
            catch (e) {
                this.log.error(e);
            }
        }
    }
    async stopClock() {
        this._clockRunning = false;
        await this.publishClockStatus();
    }
    async publishClockStatus() {
        if (!this.ipcClock) {
            return;
        }
        await this.ipcClock.publish({ running: this._clockRunning });
    }
}
exports.FakeDriver = FakeDriver;
//# sourceMappingURL=driver.js.map