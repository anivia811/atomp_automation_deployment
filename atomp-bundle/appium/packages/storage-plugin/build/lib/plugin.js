"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoragePlugin = void 0;
const plugin_1 = require("appium/plugin");
const storage_1 = require("./storage");
const support_1 = require("@appium/support");
const lru_cache_1 = require("lru-cache");
const ws_1 = __importDefault(require("ws"));
const node_stream_1 = require("node:stream");
const driver_1 = require("appium/driver");
const log = support_1.logger.getLogger('StoragePlugin');
let SHARED_STORAGE = null;
const STORAGE_PREFIX = '/storage';
const WS_TTL_MS = 5 * 60 * 1000;
const STORAGE_HANDLERS = {};
const STORAGE_ADDITIONS_CACHE = new lru_cache_1.LRUCache({
    max: 20,
    ttl: WS_TTL_MS,
    dispose: (f) => f(),
});
class StoragePlugin extends plugin_1.BasePlugin {
    static async updateServer(expressApp, httpServer) {
        const buildHandler = (methodName) => async (req, res) => {
            let status = 200;
            let body;
            try {
                const value = await STORAGE_HANDLERS[methodName](req, httpServer);
                body = { value: value ?? null };
            }
            catch (e) {
                [status, body] = (0, driver_1.getResponseForW3CError)(e);
            }
            log.debug(`Responding to ${methodName} with ${support_1.util.truncateString(JSON.stringify(body.value), { length: 200 })}`);
            res.set('content-type', 'application/json; charset=utf-8');
            res.status(status).send(body);
        };
        expressApp.post(`${STORAGE_PREFIX}/add`, buildHandler(STORAGE_HANDLERS.addStorageItem.name));
        expressApp.get(`${STORAGE_PREFIX}/list`, buildHandler(STORAGE_HANDLERS.listStorageItems.name));
        expressApp.post(`${STORAGE_PREFIX}/reset`, buildHandler(STORAGE_HANDLERS.resetStorage.name));
        expressApp.post(`${STORAGE_PREFIX}/delete`, buildHandler(STORAGE_HANDLERS.deleteStorageItem.name));
    }
}
exports.StoragePlugin = StoragePlugin;
STORAGE_HANDLERS.addStorageItem = async function addStorageItem(req, httpServer) {
    if (!httpServer) {
        throw new Error('httpServer is required to add a storage item');
    }
    const itemOptions = (0, storage_1.requireValidItemOptions)(parseRequestArgs(req, ['name', 'sha1']));
    const [stream, events] = await prepareWebSockets(httpServer, itemOptions);
    return {
        ws: {
            stream,
            events,
        },
        ttlMs: WS_TTL_MS,
    };
};
STORAGE_HANDLERS.listStorageItems = async function listStorageItems() {
    return await executeStorageMethod(async (storage) => await storage.list());
};
STORAGE_HANDLERS.deleteStorageItem = async function deleteStorageItem(req) {
    let name;
    try {
        name = parseRequestArgs(req, ['name']).name;
        (0, storage_1.validateStorageItemName)(name);
    }
    catch (e) {
        log.error(`Failed to parse the request body for deleting a storage item: ${e.message}`);
        return false;
    }
    return await executeStorageMethod(async (storage) => await storage.delete(name));
};
STORAGE_HANDLERS.resetStorage = async function resetStorage() {
    await executeStorageMethod(async (storage) => await storage.reset());
};
async function executeStorageMethod(method) {
    const storage = await getStorageSingleton();
    return await method(storage);
}
function parseRequestArgs(req, requiredKeys) {
    if (!support_1.util.isPlainObject(req.body)) {
        throw new storage_1.StorageArgumentError(`The request body must be a valid JSON object`);
    }
    for (const key of requiredKeys) {
        if (!Object.hasOwn(req.body, key)) {
            throw new storage_1.StorageArgumentError(`The required argument '${key}' is missing (expected ${JSON.stringify(requiredKeys)})`);
        }
    }
    return req.body;
}
async function prepareWebSockets(httpServer, itemOptions) {
    const commonPathname = `${STORAGE_PREFIX}/add/${itemOptions.sha1}`;
    const streamPathname = `${commonPathname}/stream`;
    const eventsPathname = `${commonPathname}/events`;
    if (!support_1.util.isEmpty(httpServer.getWebSocketHandlers(streamPathname))) {
        return [streamPathname, eventsPathname];
    }
    const streamServer = new ws_1.default.Server({
        noServer: true,
    });
    const eventsServer = new ws_1.default.Server({
        noServer: true,
    });
    const signaler = new node_stream_1.EventEmitter();
    const streamDoneCallback = () => {
        log.debug(`Unmounting stream and events web sockets at ${commonPathname}`);
        void httpServer.removeWebSocketHandler(streamPathname);
        void httpServer.removeWebSocketHandler(eventsPathname);
        setTimeout(() => {
            streamServer.close();
            eventsServer.close();
            signaler.removeAllListeners();
        }, 100);
    };
    STORAGE_ADDITIONS_CACHE.set(itemOptions.sha1, streamDoneCallback);
    eventsServer.on('connection', async (wsUpstream) => {
        signaler.on('status', (value) => wsUpstream.send(JSON.stringify(value)));
    });
    eventsServer.on('error', (e) => {
        log.info(`The ${eventsPathname} web socket server has notified about an error: ${e.message}`);
    });
    streamServer.on('connection', async (wsUpstream) => {
        log.info(`Starting a new server storage upload of '${itemOptions.name}' at ${streamPathname}`);
        const storage = await getStorageSingleton();
        try {
            await storage.add(itemOptions, wsUpstream);
            const successEvent = {
                value: {
                    success: true,
                    ...itemOptions,
                },
            };
            log.debug(`Notifying about the successful addition of '${itemOptions.name}' to the server storage`);
            signaler.emit('status', successEvent);
            STORAGE_ADDITIONS_CACHE.delete(itemOptions.sha1);
        }
        catch (e) {
            log.debug(`Notifying about a failure while adding '${itemOptions.name}' to the server storage`);
            // in case of a failure we do not want to close the server yet
            // in anticipation of a retry
            log.error(e);
            const [, errorBody] = (0, driver_1.getResponseForW3CError)(e);
            signaler.emit('status', errorBody);
        }
    });
    streamServer.on('error', (e) => {
        log.info(`The ${streamPathname} web socket server has notified about an error: ${e.message}`);
    });
    await Promise.all([
        httpServer.addWebSocketHandler(streamPathname, streamServer),
        httpServer.addWebSocketHandler(eventsPathname, eventsServer),
    ]);
    return [streamPathname, eventsPathname];
}
const getStorageSingleton = support_1.util.memoize(async () => {
    let storageRoot;
    let shouldPreserveRoot = false;
    let shouldPreserveFiles = false;
    if (process.env.APPIUM_STORAGE_ROOT) {
        storageRoot = process.env.APPIUM_STORAGE_ROOT;
        shouldPreserveRoot = shouldPreserveFiles = await support_1.fs.exists(storageRoot);
        log.info(`Set '${storageRoot}' as the server storage root folder`);
    }
    else {
        storageRoot = await support_1.tempDir.openDir();
        log.info(`Created '${storageRoot}' as the temporary server storage root folder`);
    }
    if (process.env.APPIUM_STORAGE_KEEP_ALL) {
        shouldPreserveFiles = ['true', '1', 'yes'].includes((process.env.APPIUM_STORAGE_KEEP_ALL ?? '').toLowerCase());
    }
    if (shouldPreserveFiles) {
        log.info(`All server storage items will be always preserved unless deleted explicitly`);
    }
    else {
        log.info(`All server storage items will be cleaned up automatically from '${storageRoot}' after ` +
            `Appium server termination`);
    }
    SHARED_STORAGE = new storage_1.Storage(storageRoot, shouldPreserveRoot, shouldPreserveFiles, log);
    await SHARED_STORAGE.reset();
    return SHARED_STORAGE;
});
process.once('exit', () => {
    SHARED_STORAGE?.cleanupSync();
});
exports.default = StoragePlugin;
//# sourceMappingURL=plugin.js.map