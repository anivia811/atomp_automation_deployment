"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginE2EHarness = pluginE2EHarness;
exports.getPort = getPort;
/* eslint-disable no-console */
const node_net_1 = __importDefault(require("node:net"));
const node_module_1 = require("node:module");
const teen_process_1 = require("teen_process");
const support_1 = require("appium/support");
const appium_1 = require("appium");
const async_lock_1 = __importDefault(require("async-lock"));
const _require = (0, node_module_1.createRequire)(__filename);
const APPIUM_BIN = _require.resolve('appium');
const lock = new async_lock_1.default();
const logSymbols = {
    info: 'ℹ',
    success: '✔',
    warning: '⚠',
    error: '✖',
};
/**
 * Creates hooks to install a driver and a plugin and starts an Appium server w/ the given extensions.
 *
 * @param opts - Options for the plugin E2E harness
 * @returns An object with `setup` and `teardown` callbacks
 * @throws {Error} If a free port could not be found
 * @throws {Error} If the Appium server could not be started
 * @throws {Error} If the driver could not be installed
 * @throws {Error} If the plugin could not be installed
 */
function pluginE2EHarness(opts) {
    const { appiumHome, serverArgs = {}, driverSource, driverPackage, driverName, driverSpec, pluginSource, pluginPackage, pluginSpec, pluginName, port, host, } = opts;
    let server;
    const setup = async function setup() {
        const setupAppiumHome = async () => {
            const env = { ...process.env };
            if (appiumHome) {
                env.APPIUM_HOME = appiumHome;
                await support_1.fs.mkdirp(appiumHome);
                console.log(`${logSymbols.info} Set \`APPIUM_HOME\` to ${appiumHome}`);
            }
            return env;
        };
        const installDriver = async (env) => {
            console.log(`${logSymbols.info} Checking if driver "${driverName}" is installed...`);
            const driverListArgs = [APPIUM_BIN, 'driver', 'list', '--json'];
            console.log(`${logSymbols.info} Running: ${process.execPath} ${driverListArgs.join(' ')}`);
            const { stdout: driverListJson } = await (0, teen_process_1.exec)(process.execPath, driverListArgs, {
                env,
            });
            const installedDrivers = JSON.parse(driverListJson);
            if (!installedDrivers[driverName]?.installed) {
                console.log(`${logSymbols.warning} Driver "${driverName}" not installed; installing...`);
                const driverArgs = [APPIUM_BIN, 'driver', 'install', '--source', driverSource, driverSpec];
                if (driverPackage) {
                    driverArgs.push('--package', driverPackage);
                }
                console.log(`${logSymbols.info} Running: ${process.execPath} ${driverArgs.join(' ')}`);
                await (0, teen_process_1.exec)(process.execPath, driverArgs, {
                    env,
                });
            }
            console.log(`${logSymbols.success} Installed driver "${driverName}"`);
        };
        const installPlugin = async (env) => {
            console.log(`${logSymbols.info} Checking if plugin "${pluginName}" is installed...`);
            const pluginListArgs = [APPIUM_BIN, 'plugin', 'list', '--json'];
            const { stdout: pluginListJson } = await (0, teen_process_1.exec)(process.execPath, pluginListArgs, {
                env,
            });
            const installedPlugins = JSON.parse(pluginListJson);
            if (!installedPlugins[pluginName]?.installed) {
                console.log(`${logSymbols.warning} Plugin "${pluginName}" not installed; installing...`);
                const pluginArgs = [APPIUM_BIN, 'plugin', 'install', '--source', pluginSource, pluginSpec];
                if (pluginPackage) {
                    pluginArgs.push('--package', pluginPackage);
                }
                console.log(`${logSymbols.info} Running: ${process.execPath} ${pluginArgs.join(' ')}`);
                await (0, teen_process_1.exec)(process.execPath, pluginArgs, {
                    env,
                });
            }
            console.log(`${logSymbols.success} Installed plugin "${pluginName}"`);
        };
        const startAppiumServer = async () => {
            const resolvedPort = port ?? (await getPort());
            console.log(`${logSymbols.info} Will use port ${resolvedPort} for Appium server`);
            const args = {
                port: resolvedPort,
                address: host,
                usePlugins: [pluginName],
                useDrivers: [driverName],
                appiumHome,
                ...serverArgs,
            };
            server = (await (0, appium_1.main)(args));
        };
        const env = await setupAppiumHome();
        await installDriver(env);
        await installPlugin(env);
        await startAppiumServer();
        return { server: server };
    };
    const teardown = async function teardown() {
        await server?.close();
    };
    return {
        setup,
        teardown,
    };
}
/**
 * Returns a first available free port number on the local machine.
 * The function call is race-free and thread-safe.
 *
 * @returns Port number
 * @throws {Error} If a free port could not be found
 */
async function getPort() {
    return await lock.acquire('getPort', async () => {
        const server = node_net_1.default.createServer();
        return await new Promise((resolve, reject) => {
            server.once('error', reject);
            server.listen(0, () => {
                const address = server.address();
                if (!address || typeof address === 'string') {
                    server.close(() => reject(new Error('Could not resolve a free port')));
                    return;
                }
                server.close((err) => (err ? reject(err) : resolve(address.port)));
            });
        });
    });
}
//# sourceMappingURL=harness.js.map