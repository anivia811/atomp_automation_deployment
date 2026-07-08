"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageArgumentError = exports.Storage = void 0;
exports.requireValidItemOptions = requireValidItemOptions;
exports.validateStorageItemName = validateStorageItemName;
const support_1 = require("@appium/support");
const asyncbox_1 = require("asyncbox");
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const async_lock_1 = __importDefault(require("async-lock"));
const node_crypto_1 = require("node:crypto");
const MAX_TASKS = 5;
const TMP_EXT = '.filepart';
const ADDITION_LOCK = new async_lock_1.default();
const WS_SERVER_ERROR = 1011;
const SHA1_HASH_LEN = 40;
class Storage {
    _root;
    _log;
    _shouldPreserveRoot;
    _shouldPreserveFiles;
    constructor(root, shouldPreserveRoot, shouldPreserveFiles, log) {
        this._root = root;
        this._log = log;
        this._shouldPreserveRoot = shouldPreserveRoot;
        this._shouldPreserveFiles = shouldPreserveFiles;
    }
    async list() {
        const items = (await this._listFiles()).filter((p) => !p.fullpath().endsWith(TMP_EXT));
        if (support_1.util.isEmpty(items)) {
            return [];
        }
        const stats = await (0, asyncbox_1.asyncmap)(items, (item) => support_1.fs.stat(item.fullpath()), {
            concurrency: MAX_TASKS,
        });
        return items.map((item, index) => ({
            name: node_path_1.default.basename(item.fullpath()),
            path: item.fullpath(),
            size: stats[index].size,
        }));
    }
    async add(opts, source) {
        const { name } = requireValidItemOptions(opts);
        // toLowerCase is needed for case-insensitive server filesystems
        await ADDITION_LOCK.acquire(name.toLowerCase(), async () => {
            if (typeof source.pipe === 'function') {
                await this._addFromStream(opts, source);
            }
            else {
                await this._addFromWebSocket(opts, source);
            }
        });
    }
    async delete(name) {
        if (name.toLowerCase().endsWith(TMP_EXT)) {
            return false;
        }
        const destinationPath = node_path_1.default.join(this._root, name);
        if (!(await support_1.fs.exists(destinationPath))) {
            return false;
        }
        await support_1.fs.rimraf(destinationPath);
        return true;
    }
    async reset() {
        if (!this._shouldPreserveRoot && !this._shouldPreserveFiles) {
            await support_1.fs.rimraf(this._root);
        }
        if (!(await support_1.fs.exists(this._root))) {
            await support_1.fs.mkdirp(this._root);
            return;
        }
        const files = (await this._listFiles())
            .map((p) => p.fullpath())
            .filter((fullPath) => !this._shouldPreserveFiles || node_path_1.default.basename(fullPath).toLowerCase().endsWith(TMP_EXT));
        if (support_1.util.isEmpty(files)) {
            return;
        }
        await (0, asyncbox_1.asyncmap)(files, (fullPath) => support_1.fs.rimraf(fullPath), { concurrency: MAX_TASKS });
    }
    cleanupSync() {
        this._log.debug(`Cleaning up the '${this._root}' server storage folder`);
        if (!this._shouldPreserveRoot && !this._shouldPreserveFiles) {
            support_1.fs.rimrafSync(this._root);
            return;
        }
        let itemNames;
        try {
            itemNames = node_fs_1.default.readdirSync(this._root).filter((name) => !name.startsWith('.'));
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            this._log.warn(`Cannot list the '${this._root}' server storage folder. Original error: ${message}. ` +
                `Skipping the cleanup.`);
            return;
        }
        if (support_1.util.isEmpty(itemNames)) {
            if (!this._shouldPreserveRoot) {
                support_1.fs.rimrafSync(this._root);
            }
            return;
        }
        const matchedNames = itemNames.filter((name) => !this._shouldPreserveFiles || name.toLowerCase().endsWith(TMP_EXT));
        for (const matchedName of matchedNames) {
            support_1.fs.rimrafSync(node_path_1.default.join(this._root, matchedName));
        }
        const remainingNames = itemNames.filter((name) => !matchedNames.includes(name));
        if (!this._shouldPreserveRoot && support_1.util.isEmpty(remainingNames)) {
            support_1.fs.rimrafSync(this._root);
        }
    }
    async _listFiles() {
        const paths = (await support_1.fs.glob('*', {
            cwd: this._root,
            withFileTypes: true,
        }));
        return paths.filter((item) => item.isFile());
    }
    async _addFromStream(opts, source) {
        const { name } = opts;
        const fullPath = node_path_1.default.join(this._root, toTempName(name));
        const timer = new support_1.timing.Timer().start();
        const destination = support_1.fs.createWriteStream(fullPath);
        source.pipe(destination);
        try {
            await new Promise((resolve, reject) => {
                destination.once('finish', () => resolve(true));
                source.once('error', reject);
                destination.once('error', reject);
            });
            await this._finalizeItem(opts, timer, fullPath, await support_1.fs.hash(fullPath));
        }
        catch (e) {
            await support_1.fs.rimraf(fullPath);
            throw e;
        }
    }
    async _addFromWebSocket(opts, source) {
        const { name, sha1 } = opts;
        const fullPath = node_path_1.default.join(this._root, toTempName(name));
        const timer = new support_1.timing.Timer().start();
        const destination = support_1.fs.createWriteStream(fullPath);
        const sha1sum = (0, node_crypto_1.createHash)('sha1');
        let didDigestMatch = false;
        let recentDigest = null;
        try {
            await new Promise((resolve, reject) => {
                source.on('message', (data) => {
                    if (didDigestMatch) {
                        // ignore further chunks if hashes have already matched
                        return;
                    }
                    destination.write(data, (e) => {
                        if (e) {
                            source.close(WS_SERVER_ERROR);
                            reject(e);
                        }
                    });
                    sha1sum.update(data);
                    recentDigest = sha1sum.copy().digest('hex');
                    if (recentDigest.toLowerCase() === sha1.toLowerCase()) {
                        didDigestMatch = true;
                        destination.close(() => resolve(true));
                    }
                });
                source.once('close', () => {
                    destination.close(() => resolve(true));
                });
                source.once('error', reject);
                destination.once('error', (e) => {
                    source.close(WS_SERVER_ERROR);
                    reject(e);
                });
            });
            await this._finalizeItem(opts, timer, fullPath, recentDigest ?? sha1sum.digest('hex'));
        }
        catch (e) {
            await support_1.fs.rimraf(fullPath);
            throw e;
        }
    }
    async _finalizeItem(opts, timer, fullPath, actualHashDigest) {
        const { name, sha1 } = opts;
        this._log.info(`'${name}' has been added to the server storage within ` +
            `${timer.getDuration().asMilliSeconds}ms. Verifying hashes.`);
        if (actualHashDigest.toLowerCase() !== sha1.toLowerCase()) {
            throw new StorageArgumentError(`The actual SHA1 hash value '${actualHashDigest}' must be equal ` +
                `to the expected hash value of '${sha1}' for '${name}'`);
        }
        await support_1.fs.mv(fullPath, node_path_1.default.join(this._root, name));
    }
}
exports.Storage = Storage;
class StorageArgumentError extends Error {
}
exports.StorageArgumentError = StorageArgumentError;
/**
 * Validates storage item options and returns the same object when valid.
 * @param opts Candidate item options.
 */
function requireValidItemOptions(opts) {
    validateStorageItemName(opts.name);
    if (opts.sha1?.length !== SHA1_HASH_LEN) {
        throw new StorageArgumentError(`The provided hash value '${opts.sha1}' must be a valid SHA1 string, for ` +
            `example 'ccc963411b2621335657963322890305ebe96186'`);
    }
    return opts;
}
/**
 * Validate storage item name and throw if it is invalid.
 * @param name The name to validate.
 */
function validateStorageItemName(name) {
    if (support_1.util.isEmpty(name)) {
        throw new StorageArgumentError(`The provided file name '${name}' must not be empty`);
    }
    const sanitizedName = support_1.fs.sanitizeName(name, {
        replacement: '_',
    });
    if (name !== sanitizedName) {
        throw new StorageArgumentError(`The provided name value '${name}' must be a valid file name. ` +
            `Did you mean '${sanitizedName}'?`);
    }
}
function toTempName(origName) {
    return `${origName}${TMP_EXT}`;
}
//# sourceMappingURL=storage.js.map