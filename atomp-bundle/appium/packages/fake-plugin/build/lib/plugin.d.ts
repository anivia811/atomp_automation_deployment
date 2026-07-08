import { BasePlugin } from 'appium/plugin';
import type { Request, Response, Application } from 'express';
import type { AppiumServer, BidiModuleMap, ExecuteMethodMap, ExternalDriver, MethodMap } from '@appium/types';
/** Driver as seen by this plugin; may include plugin-specific session data */
export type DriverLike = ExternalDriver & {
    fakeSessionData?: unknown;
};
export declare class FakePlugin extends BasePlugin {
    static newMethodMap: MethodMap<FakePlugin>;
    static newBidiCommands: BidiModuleMap;
    static executeMethodMap: ExecuteMethodMap<FakePlugin>;
    private static _unexpectedData;
    protected _clockRunning: boolean;
    private readonly fakeThing;
    private pluginThing;
    private fakeDriverClockIsRunning;
    private ipcPluginMath?;
    constructor(name: string, cliArgs?: Record<string, unknown>);
    static fakeRoute(_req: Request, res: Response): void;
    static unexpectedData(_req: Request, res: Response): void;
    static updateServer(expressApp: Application, _httpServer: AppiumServer, cliArgs: Record<string, unknown>): Promise<void>;
    onIpcInit(): Promise<void>;
    startClock(): Promise<void>;
    doSomeMath(next: () => Promise<number>, _driver: DriverLike, num1: number, num2: number): Promise<number>;
    doSomeMath2(_next: () => Promise<unknown>, _driver: DriverLike, num1: number, num2: number): Promise<number>;
    getFakeThing(): Promise<string>;
    getPluginThing(): Promise<unknown>;
    setPluginThing(_next: () => Promise<unknown>, _driver: DriverLike, thing: unknown): Promise<void>;
    plugMeIn(_next: () => Promise<unknown>, _driver: DriverLike, socket: string): Promise<string>;
    getFakePluginArgs(): Promise<Record<string, unknown>>;
    getFakeDriverClockStatus(): Promise<boolean>;
    getPageSource(_next: () => Promise<string>, _driver: DriverLike, ...args: unknown[]): Promise<string>;
    findElement(next: () => Promise<{
        fake?: boolean;
    } & Record<string, unknown>>, _driver: DriverLike, ...args: unknown[]): Promise<{
        fake?: boolean;
    } & Record<string, unknown>>;
    getFakeSessionData(_next: () => Promise<unknown>, driver: DriverLike): Promise<unknown>;
    setFakeSessionData(_next: () => Promise<unknown>, driver: DriverLike, ...args: unknown[]): Promise<null>;
    getWindowHandle(next: () => Promise<string>): Promise<string>;
    onUnexpectedShutdown(_driver: DriverLike, cause: Error | string): Promise<void>;
    execute(next: () => Promise<unknown>, driver: DriverLike, script: string, args: unknown[]): Promise<unknown>;
    deleteSession(next: () => Promise<unknown>): Promise<unknown>;
}
//# sourceMappingURL=plugin.d.ts.map