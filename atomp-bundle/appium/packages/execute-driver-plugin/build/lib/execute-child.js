"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MJSONWP_ELEMENT_KEY = exports.W3C_ELEMENT_KEY = void 0;
const node_vm_1 = __importDefault(require("node:vm"));
const node_util_1 = require("node:util");
const support_1 = require("@appium/support");
const vm_host_binding_1 = require("./vm-host-binding");
const log = support_1.logger.getLogger('ExecuteDriver Child');
let send;
// duplicate defining these keys here so we don't need to re-load a huge appium
// dependency tree into memory just to run a wdio script
exports.W3C_ELEMENT_KEY = support_1.util.W3C_WEB_ELEMENT_IDENTIFIER;
exports.MJSONWP_ELEMENT_KEY = 'ELEMENT';
/**
 * Run the script in a VM.
 * @param eventParams - The driver script message event parameters
 * @returns Promise resolving to the run script result
 * @throws {TypeError}
 */
async function runScript(eventParams) {
    const { driverOpts, script, timeoutMs } = eventParams;
    if (typeof timeoutMs !== 'number' || Number.isNaN(timeoutMs)) {
        throw new TypeError('Timeout parameter must be a number');
    }
    /**
     * set up fake logger
     */
    const logs = {
        error: [],
        warn: [],
        log: [],
    };
    const consoleFns = {
        error: (0, vm_host_binding_1.wrapHostBindingForVmContext)((...logMsgs) => logs.error.push(...logMsgs)),
        warn: (0, vm_host_binding_1.wrapHostBindingForVmContext)((...logMsgs) => logs.warn.push(...logMsgs)),
        log: (0, vm_host_binding_1.wrapHostBindingForVmContext)((...logMsgs) => logs.log.push(...logMsgs)),
    };
    const { attach } = await import('webdriverio');
    const driver = await attach(driverOpts);
    const sandboxDriver = (0, vm_host_binding_1.wrapHostBindingForVmContext)(driver);
    const sandboxConsole = (0, vm_host_binding_1.wrapHostBindingForVmContext)(consoleFns);
    const sandboxSetTimeout = (0, vm_host_binding_1.wrapHostBindingForVmContext)(setTimeout);
    const sandboxClearTimeout = (0, vm_host_binding_1.wrapHostBindingForVmContext)(clearTimeout);
    const fullScript = `(async () => {${script}})();`;
    log.info('Running driver script in Node vm');
    // run the driver script, giving user access to the driver object, a fake console logger,
    // and standard setTimeout/clearTimeout functions. Each host value is proxied so
    // main-realm prototype metadata cannot be used to obtain the host `Function` (VM escape).
    let result = await node_vm_1.default.runInNewContext(fullScript, {
        driver: sandboxDriver,
        console: sandboxConsole,
        setTimeout: sandboxSetTimeout,
        clearTimeout: sandboxClearTimeout,
    }, { timeout: timeoutMs, breakOnSigint: true });
    result = coerceScriptResult(result);
    log.info('Successfully ensured driver script result is appropriate type for return');
    return { result, logs };
}
/**
 * We can get any manner of crazy thing back from a vm executing untrusted
 * code. We might also get WebdriverIO objects that aren't suitable for JSON
 * response. So make sure we convert the things we know about to their
 * appropriate response format, and squash other weird things.
 *
 * @param obj - object to convert and sanitize
 * @return safely converted object
 */
function coerceScriptResult(obj) {
    // first ensure obj is of a type that can be JSON encoded safely. This will
    // get rid of custom objects, functions, etc... and turn them into POJOs
    try {
        obj = JSON.parse(JSON.stringify(obj));
    }
    catch {
        log.warn('Could not convert executeDriverScript to safe response!' +
            `Result was: ${JSON.stringify(obj)}. Will make it null`);
        return null;
    }
    let res;
    // now we begin our recursive case options
    if (support_1.util.isPlainObject(obj)) {
        // if we have an object, it's either an element object or something else
        // webdriverio has no monadic object types other than element and driver,
        // and we don't want to allow special casing return of driver
        res = {};
        if (obj[exports.MJSONWP_ELEMENT_KEY] || obj[exports.W3C_ELEMENT_KEY]) {
            // if it's an element object, clear out anything that's not the key, and then return the
            // object. Note that if the element object contains only one element key type (MJSONWP or
            // W3C), keep it that way in our response. But if the element contains both key types
            // (because the client is being backwards compatible) then keep both keys in our response as
            // well.
            if (obj[exports.MJSONWP_ELEMENT_KEY]) {
                res[exports.MJSONWP_ELEMENT_KEY] = obj[exports.MJSONWP_ELEMENT_KEY];
            }
            if (obj[exports.W3C_ELEMENT_KEY]) {
                res[exports.W3C_ELEMENT_KEY] = obj[exports.W3C_ELEMENT_KEY];
            }
            return res;
        }
        // otherwise, recurse into the object
        for (const key of Object.keys(obj)) {
            res[key] = coerceScriptResult(obj[key]);
        }
        return res;
    }
    // also handle arrays
    if (Array.isArray(obj)) {
        return obj.map(coerceScriptResult);
    }
    // base case, if it's not an object or array, return straightaway
    return obj;
}
/**
 * Entry point to runScript
 * @param eventParams - The driver script message event parameters
 */
async function main(eventParams) {
    /**
     * keep the response of runScript
     */
    let res;
    log.info('Parameters received from parent process');
    try {
        res = { success: await runScript(eventParams) };
        log.info('runScript success');
    }
    catch (error) {
        log.info('runScript error');
        res = { error: { message: error.message, stack: error.stack } };
    }
    await send(res);
}
// ensure we're running this script in IPC mode
if (require.main === module && typeof process.send === 'function') {
    send = (0, node_util_1.promisify)(process.send).bind(process);
    log.info('Running driver execution in child process');
    process.on('message', main);
}
//# sourceMappingURL=execute-child.js.map