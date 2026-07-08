"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAppiumJson = exports.runAppiumRaw = exports.runAppium = exports.log = exports.EXECUTABLE = void 0;
exports.installLocalExtension = installLocalExtension;
exports.readAppiumArgErrorFixture = readAppiumArgErrorFixture;
exports.formatAppiumArgErrorOutput = formatAppiumArgErrorOutput;
/**
 * Helper functions for E2E tests to spawn an `appium` subprocess.
 */
const support_1 = require("@appium/support");
const node_path_1 = __importDefault(require("node:path"));
const teen_process_1 = require("teen_process");
const helpers_1 = require("../helpers");
exports.EXECUTABLE = node_path_1.default.join(helpers_1.APPIUM_ROOT, 'build', 'lib', 'main.js');
exports.log = new support_1.console.CliConsole();
function curry2(fn) {
    function curried(a, b) {
        if (arguments.length >= 2) {
            return fn(a, b);
        }
        return (b2) => fn(a, b2);
    }
    return curried;
}
function curry3(fn) {
    function curried(a, b, c) {
        if (arguments.length >= 3) {
            return fn(a, b, c);
        }
        if (arguments.length === 2) {
            return (c2) => fn(a, b, c2);
        }
        return (b2) => (c2) => fn(a, b2, c2);
    }
    return curried;
}
async function run(appiumHome, args, opts = {}) {
    const cwd = helpers_1.APPIUM_ROOT;
    const env = { ...opts.env };
    env.APPIUM_HOME ??= appiumHome;
    env.PATH ??= process.env.PATH;
    try {
        const fullArgs = [...process.execArgv, '--', exports.EXECUTABLE, ...args];
        if (process.env._FORCE_LOGS) {
            exports.log.debug('APPIUM_HOME: %s', env.APPIUM_HOME);
            exports.log.debug(`Running: ${process.execPath} ${fullArgs.join(' ')}`);
        }
        const retval = await (0, teen_process_1.exec)(process.execPath, fullArgs, { ...opts, cwd, env });
        const strip = (s) => (opts.env?.FORCE_COLOR ? s : support_1.console.stripColors(s));
        return {
            stdout: strip(retval.stdout),
            stderr: strip(retval.stderr),
        };
    }
    catch (err) {
        const { stdout = '', stderr = '' } = err;
        const execErr = err;
        const baseErr = err instanceof Error ? err : new Error(String(err));
        const runErr = Object.assign(baseErr, {
            originalMessage: baseErr.message,
            message: `${stdout.trim()}\n\n${stderr.trim()}`,
            command: `${process.execPath} ${exports.EXECUTABLE} ${args.join(' ')}`,
            env,
            cwd,
            stdout,
            stderr,
            code: execErr.code ?? 1,
        });
        throw runErr;
    }
}
async function _runAppium(appiumHome, args) {
    const { stdout } = await run(appiumHome, args);
    return stdout;
}
exports.runAppium = curry2(_runAppium);
async function _runAppiumRaw(appiumHome, args, opts) {
    try {
        return await run(appiumHome, args, opts);
    }
    catch (err) {
        return err;
    }
}
exports.runAppiumRaw = curry3(_runAppiumRaw);
async function _runAppiumJson(appiumHome, args) {
    const a = args.includes('--json') ? args : [...args, '--json'];
    const stdout = await (0, exports.runAppium)(appiumHome, a);
    try {
        return JSON.parse(stdout);
    }
    catch (err) {
        err.message = `Error parsing JSON. Contents of STDOUT: ${stdout}`;
        throw err;
    }
}
exports.runAppiumJson = curry2(_runAppiumJson);
async function installLocalExtension(appiumHome, type, pathToExtension) {
    return (0, exports.runAppiumJson)(appiumHome, [
        type,
        'install',
        '--source',
        'local',
        pathToExtension,
    ]);
}
async function readAppiumArgErrorFixture(name) {
    const filepath = (0, helpers_1.resolveFixture)(name);
    const body = await support_1.fs.readFile(filepath, 'utf8');
    return formatAppiumArgErrorOutput(body);
}
function formatAppiumArgErrorOutput(stderr) {
    return stderr.replace(/^[\s\S]+\n\n([\s\S]+)/, '$1').trim() + '\n';
}
//# sourceMappingURL=e2e-helpers.js.map