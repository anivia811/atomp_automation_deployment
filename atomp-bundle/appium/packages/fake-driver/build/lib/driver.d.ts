import type { Express, Request, Response } from 'express';
import type { Server as HttpServer } from 'node:http';
import { BaseDriver } from 'appium/driver';
import type { DriverData, IIpcSubscription, InitialOpts, IpcData } from '@appium/types';
import type { FakeDriverConstraints } from './desired-caps';
import type { FakeDriverCaps, W3CFakeDriverCaps } from './types';
import { FakeApp } from './fake-app';
import type { FakeElement } from './fake-element';
import * as alertCommands from './commands/alert';
import * as contextsCommands from './commands/contexts';
import * as elementCommands from './commands/element';
import * as findCommands from './commands/find';
import * as generalCommands from './commands/general';
export type { FakeDriverConstraints };
export type { Orientation } from '@appium/types';
export type ClockStatus = {
    running: boolean;
};
/** Driver supporting a generic "fake thing" value (getFakeThing / setFakeThing). */
export declare class FakeDriver<Thing extends IpcData = null> extends BaseDriver<FakeDriverConstraints> {
    static newBidiCommands: {
        readonly 'appium:fake': {
            readonly getFakeThing: {
                readonly command: "getFakeThing";
            };
            readonly setFakeThing: {
                readonly command: "setFakeThing";
                readonly params: {
                    readonly required: readonly ["thing"];
                };
            };
            readonly doSomeMath: {
                readonly command: "doSomeMath";
                readonly params: {
                    readonly required: readonly ["num1", "num2"];
                };
            };
            readonly doSomeMath2: {
                readonly command: "doSomeMath2";
                readonly params: {
                    readonly required: readonly ["num1", "num2"];
                };
            };
        };
    };
    static newMethodMap: {
        readonly '/session/:sessionId/fakedriver': {
            readonly GET: {
                readonly command: "getFakeThing";
            };
            readonly POST: {
                readonly command: "setFakeThing";
                readonly payloadParams: {
                    readonly required: readonly ["thing"];
                };
            };
        };
        readonly '/session/:sessionId/fakedriverargs': {
            readonly GET: {
                readonly command: "getFakeDriverArgs";
            };
        };
        readonly '/session/:sessionId/deprecated': {
            readonly POST: {
                readonly command: "callDeprecatedCommand";
                readonly deprecated: true;
            };
        };
        readonly '/session/:sessionId/doubleclick': {
            readonly POST: {
                readonly command: "doubleClick";
            };
        };
    };
    static executeMethodMap: {
        readonly 'fake: addition': {
            readonly command: "fakeAddition";
            readonly params: {
                readonly required: readonly ["num1", "num2"];
                readonly optional: readonly ["num3"];
            };
        };
        readonly 'fake: getThing': {
            readonly command: "getFakeThing";
        };
        readonly 'fake: setThing': {
            readonly command: "setFakeThing";
            readonly params: {
                readonly required: readonly ["thing"];
            };
        };
        readonly 'fake: getDeprecatedCommandsCalled': {
            readonly command: "getDeprecatedCommandsCalled";
        };
        readonly 'fake: getLastPluginMath': {
            readonly command: "getLastPluginMath";
        };
        readonly 'fake: startClock': {
            readonly command: "fakeStartClock";
        };
        readonly 'fake: stopClock': {
            readonly command: "fakeStopClock";
        };
    };
    readonly desiredCapConstraints: {
        readonly app: {
            readonly presence: true;
            readonly isString: true;
        };
        readonly uniqueApp: {
            readonly isBoolean: true;
        };
        readonly runClock: {
            readonly isBoolean: true;
        };
    };
    curContext: string;
    readonly appModel: FakeApp;
    _proxyActive: boolean;
    shook: boolean;
    focusedElId: string | null;
    fakeThing: Thing | null;
    /** Next numeric id for new elements; keys in elMap are stringified. */
    maxElId: number;
    /** Map of element id (string) to FakeElement for this session. */
    elMap: Record<string, FakeElement>;
    /** Current document URL; set by bidiNavigate, returned by getUrl. */
    url: string;
    ipcClock?: IIpcSubscription<ClockStatus>;
    assertNoAlert: typeof alertCommands.assertNoAlert;
    assertAlert: typeof alertCommands.assertAlert;
    getAlertText: typeof alertCommands.getAlertText;
    setAlertText: typeof alertCommands.setAlertText;
    postAcceptAlert: typeof alertCommands.postAcceptAlert;
    postDismissAlert: typeof alertCommands.postDismissAlert;
    getRawContexts: typeof contextsCommands.getRawContexts;
    assertWebviewContext: typeof contextsCommands.assertWebviewContext;
    getCurrentContext: typeof contextsCommands.getCurrentContext;
    getContexts: typeof contextsCommands.getContexts;
    setContext: typeof contextsCommands.setContext;
    setFrame: typeof contextsCommands.setFrame;
    getElements: typeof elementCommands.getElements;
    getElement: typeof elementCommands.getElement;
    getName: typeof elementCommands.getName;
    elementDisplayed: typeof elementCommands.elementDisplayed;
    elementEnabled: typeof elementCommands.elementEnabled;
    elementSelected: typeof elementCommands.elementSelected;
    setValue: typeof elementCommands.setValue;
    getText: typeof elementCommands.getText;
    clear: typeof elementCommands.clear;
    click: typeof elementCommands.click;
    getAttribute: typeof elementCommands.getAttribute;
    getElementRect: typeof elementCommands.getElementRect;
    getSize: typeof elementCommands.getSize;
    equalsElement: typeof elementCommands.equalsElement;
    getCssProperty: typeof elementCommands.getCssProperty;
    getLocation: typeof elementCommands.getLocation;
    getLocationInView: typeof elementCommands.getLocationInView;
    getExistingElementForNode: typeof findCommands.getExistingElementForNode;
    wrapNewEl: typeof findCommands.wrapNewEl;
    findElOrEls: {
        <Ctx = unknown>(this: FakeDriver, strategy: string, selector: string, mult: true, context?: Ctx): Promise<import("@appium/types").Element[]>;
        <Ctx = unknown>(this: FakeDriver, strategy: string, selector: string, mult: false, context?: Ctx): Promise<import("@appium/types").Element>;
    };
    findElement: typeof findCommands.findElement;
    findElements: typeof findCommands.findElements;
    findElementFromElement: typeof findCommands.findElementFromElement;
    findElementsFromElement: typeof findCommands.findElementsFromElement;
    title: typeof generalCommands.title;
    keys: typeof generalCommands.keys;
    setGeoLocation: typeof generalCommands.setGeoLocation;
    getGeoLocation: typeof generalCommands.getGeoLocation;
    getPageSource: typeof generalCommands.getPageSource;
    getOrientation: typeof generalCommands.getOrientation;
    setOrientation: typeof generalCommands.setOrientation;
    getScreenshot: typeof generalCommands.getScreenshot;
    getWindowSize: typeof generalCommands.getWindowSize;
    getWindowRect: typeof generalCommands.getWindowRect;
    performActions: typeof generalCommands.performActions;
    releaseActions: typeof generalCommands.releaseActions;
    getLog: typeof generalCommands.getLog;
    mobileShake: typeof generalCommands.mobileShake;
    doubleClick: typeof generalCommands.doubleClick;
    execute: typeof generalCommands.execute;
    fakeAddition: typeof generalCommands.fakeAddition;
    getUrl: typeof generalCommands.getUrl;
    bidiNavigate: typeof generalCommands.bidiNavigate;
    getLastPluginMath: typeof generalCommands.getLastPluginMath;
    protected lastPluginMath: {
        pluginName: string;
        result: number;
    } | null;
    /** If set, Bidi connections are proxied to this URL instead of handling locally. */
    private _bidiProxyUrl;
    private _clockRunning;
    private ipcFakeThing?;
    constructor(opts?: InitialOpts, shouldValidateCaps?: boolean);
    get bidiProxyUrl(): string | null;
    get driverData(): {
        isUnique: boolean;
    };
    static fakeRoute(_req: Request, res: Response): void;
    static updateServer(expressApp: Express, _httpServer: HttpServer, cliArgs: Record<string, unknown>): Promise<void>;
    onIpcInit(): Promise<void>;
    proxyActive(): boolean;
    canProxy(): boolean;
    proxyReqRes(req: Request, res: Response): void;
    proxyCommand<T = unknown>(): Promise<T>;
    /**
     * Create session and load fake app XML from caps.app.
     * Starts clock event emitter if caps.runClock is true.
     */
    createSession(w3cCapabilities1: W3CFakeDriverCaps, w3cCapabilities2?: W3CFakeDriverCaps, w3cCapabilities3?: W3CFakeDriverCaps, driverData?: DriverData[]): Promise<[string, FakeDriverCaps]>;
    deleteSession(sessionId?: string): Promise<void>;
    getWindowHandle(): Promise<string>;
    getWindowHandles(): Promise<string[]>;
    getFakeThing(): Promise<Thing | null>;
    setFakeThing(thing: Thing): Promise<null>;
    getFakeDriverArgs(): Promise<typeof this.cliArgs>;
    /** TODO: track deprecated commands when called and return their names. */
    getDeprecatedCommandsCalled(): Promise<string[]>;
    callDeprecatedCommand(): Promise<void>;
    doSomeMath(num1: number, num2: number): Promise<number>;
    doSomeMath2(num1: number, num2: number): Promise<number>;
    fakeStartClock(): Promise<void>;
    fakeStopClock(): Promise<void>;
    private startClock;
    private stopClock;
    private publishClockStatus;
}
//# sourceMappingURL=driver.d.ts.map