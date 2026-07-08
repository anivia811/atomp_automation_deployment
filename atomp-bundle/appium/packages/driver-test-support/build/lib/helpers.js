"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_HOST = void 0;
exports.getTestPort = getTestPort;
exports.createAppiumURL = createAppiumURL;
const node_net_1 = __importDefault(require("node:net"));
/**
 * Default test host
 */
exports.TEST_HOST = '127.0.0.1';
async function getPort() {
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
}
let testPort;
/**
 * Returns a free port; one per process
 * @param force - If true, do not reuse the port (if it already exists)
 * @returns a free port
 */
async function getTestPort(force = false) {
    if (force || !testPort) {
        const port = await getPort();
        if (!testPort) {
            testPort = port;
        }
        return port;
    }
    return testPort;
}
function createAppiumURL(address, port, session, pathname) {
    const urlFor = (sess, path) => buildAppiumURL(address, port, sess, path);
    if (arguments.length === 2) {
        return urlFor;
    }
    return urlFor(session, pathname);
}
function buildAppiumURL(address, port, session, pathname) {
    let base = address;
    if (!/^https?:\/\//.test(base)) {
        base = `http://${base}`;
    }
    let path = session ? `session/${session}` : '';
    if (pathname) {
        path = `${path}/${pathname}`;
    }
    return new URL(path, `${base}:${port}`).href;
}
//# sourceMappingURL=helpers.js.map