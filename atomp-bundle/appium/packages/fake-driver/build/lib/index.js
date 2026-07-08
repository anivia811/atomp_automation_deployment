"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = exports.FakeDriver = void 0;
exports.main = main;
const driver_1 = require("./driver");
Object.defineProperty(exports, "FakeDriver", { enumerable: true, get: function () { return driver_1.FakeDriver; } });
const server_1 = require("./server");
Object.defineProperty(exports, "startServer", { enumerable: true, get: function () { return server_1.startServer; } });
const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 4774;
/** main. */
async function main() {
    const getArgValue = (argName) => {
        const argIndex = process.argv.indexOf(argName);
        return argIndex > 0 ? (process.argv[argIndex + 1] ?? null) : null;
    };
    const port = parseInt(String(getArgValue('--port')), 10) || DEFAULT_PORT;
    const host = getArgValue('--host') || DEFAULT_HOST;
    return await (0, server_1.startServer)(port, host);
}
//# sourceMappingURL=index.js.map