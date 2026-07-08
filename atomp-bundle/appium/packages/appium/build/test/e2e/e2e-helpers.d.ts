/**
 * Helper functions for E2E tests to spawn an `appium` subprocess.
 */
import { console as supportConsole } from '@appium/support';
import type { ExecError } from 'teen_process';
import type { DriverType, PluginType } from '@appium/types';
import type { CliExtensionSubcommand, ExtRecord } from 'appium/types';
export declare const EXECUTABLE: string;
export declare const log: supportConsole.CliConsole;
export type CliArgs = string[];
export type CliExtArgs<ExtSubcommand extends CliExtensionSubcommand = CliExtensionSubcommand> = [
    DriverType | PluginType,
    ExtSubcommand,
    ...string[]
];
export interface AppiumRunErrorProps {
    originalMessage: string;
    message: string;
    command: string;
    env: Record<string, string | undefined> | undefined;
    cwd: string;
}
export type AppiumRunError = Error & AppiumRunErrorProps & ExecError & {
    stdout: string;
    stderr: string;
};
export declare const runAppium: {
    (a: string): (b: CliExtArgs<CliExtensionSubcommand> | CliArgs) => Promise<string>;
    (a: string, b: CliExtArgs<CliExtensionSubcommand> | CliArgs): Promise<string>;
};
export declare const runAppiumRaw: {
    (a: string): (b: CliExtArgs<CliExtensionSubcommand> | CliArgs) => (c: {
        env?: Record<string, string>;
    }) => Promise<AppiumRunError | {
        stdout: string;
        stderr: string;
    }>;
    (a: string, b: CliExtArgs<CliExtensionSubcommand> | CliArgs): (c: {
        env?: Record<string, string>;
    }) => Promise<AppiumRunError | {
        stdout: string;
        stderr: string;
    }>;
    (a: string, b: CliExtArgs<CliExtensionSubcommand> | CliArgs, c: {
        env?: Record<string, string>;
    }): Promise<AppiumRunError | {
        stdout: string;
        stderr: string;
    }>;
};
type RunAppiumJsonCurried = {
    (appiumHome: string): (args: CliExtArgs | CliArgs) => Promise<unknown>;
    (appiumHome: string, args: CliExtArgs | CliArgs): Promise<unknown>;
};
export declare const runAppiumJson: RunAppiumJsonCurried;
export declare function installLocalExtension<ExtType extends DriverType | PluginType>(appiumHome: string, type: ExtType, pathToExtension: string): Promise<ExtRecord<ExtType>>;
export declare function readAppiumArgErrorFixture(name: string): Promise<string>;
export declare function formatAppiumArgErrorOutput(stderr: string): string;
export {};
//# sourceMappingURL=e2e-helpers.d.ts.map