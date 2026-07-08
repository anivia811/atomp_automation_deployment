"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const webdriverio_1 = require("webdriverio");
const plugin_test_support_1 = require("@appium/plugin-test-support");
const support_1 = require("@appium/support");
const axios_1 = __importDefault(require("axios"));
const ws_1 = require("ws");
const chai_1 = require("chai");
const BUFFER_SIZE = 0xffff;
const THIS_PLUGIN_DIR = support_1.node.getModuleRootSync('@appium/storage-plugin', __filename);
const APPIUM_HOME = node_path_1.default.join(THIS_PLUGIN_DIR, 'local_appium_home');
const FAKE_DRIVER_DIR = node_path_1.default.join(THIS_PLUGIN_DIR, '..', 'fake-driver');
const TEST_HOST = '127.0.0.1';
const TEST_FAKE_APP = node_path_1.default.join(APPIUM_HOME, 'node_modules', '@appium', 'fake-driver', 'test', 'fixtures', 'app.xml');
const TEST_CAPS = {
    platformName: 'Fake',
    'appium:automationName': 'Fake',
    'appium:deviceName': 'Fake',
    'appium:app': TEST_FAKE_APP,
};
const WDIO_OPTS = {
    hostname: TEST_HOST,
    connectionRetryCount: 0,
    capabilities: TEST_CAPS,
};
describe('StoragePlugin', function () {
    let driver;
    let storageRoot;
    const { setup, teardown } = (0, plugin_test_support_1.pluginE2EHarness)({
        host: TEST_HOST,
        appiumHome: APPIUM_HOME,
        driverName: 'fake',
        driverSource: 'local',
        driverSpec: FAKE_DRIVER_DIR,
        pluginName: 'storage',
        pluginSource: 'local',
        pluginSpec: THIS_PLUGIN_DIR,
    });
    before(async function () {
        const { server } = await setup();
        const address = server.address();
        WDIO_OPTS.port = address.port;
    });
    after(async function () {
        await teardown();
    });
    beforeEach(async function () {
        storageRoot = await support_1.tempDir.openDir();
        driver = await (0, webdriverio_1.remote)(WDIO_OPTS);
        const baseUrl = `http://${TEST_HOST}:${WDIO_OPTS.port}/storage`;
        driver.addCommand('addStorageItem', async (name, sha1) => (await axios_1.default.post(`${baseUrl}/add`, { name, sha1 })).data.value);
        driver.addCommand('listStorageItems', async () => (await axios_1.default.get(`${baseUrl}/list`)).data.value);
        driver.addCommand('resetStorageItems', async () => (await axios_1.default.post(`${baseUrl}/reset`)).data.value);
        driver.addCommand('deleteStorageItem', async (name) => (await axios_1.default.post(`${baseUrl}/delete`, { name })).data.value);
    });
    afterEach(async function () {
        if (driver) {
            await driver.deleteSession();
            driver = null;
        }
        if (storageRoot && (await support_1.fs.exists(storageRoot))) {
            await support_1.fs.rimraf(storageRoot);
            storageRoot = undefined;
        }
    });
    it('should manage storage files', async function () {
        let items = await driver.listStorageItems();
        (0, chai_1.expect)(items).to.be.empty;
        const name1 = node_path_1.default.basename('foo1.bar');
        const name2 = node_path_1.default.basename('foo2.bar');
        const pkgPath = node_path_1.default.join(__dirname, '..', '..', 'package.json');
        await Promise.all([addFileToStorage(TEST_FAKE_APP, name1), addFileToStorage(pkgPath, name2)]);
        items = await driver.listStorageItems();
        (0, chai_1.expect)(items.length).to.eql(2);
        (0, chai_1.expect)(new Set(items.map(({ name }) => name))).to.deep.equal(new Set([name1, name2]));
        const isDeleted = await driver.deleteStorageItem(name1);
        (0, chai_1.expect)(isDeleted).to.be.true;
        items = await driver.listStorageItems();
        (0, chai_1.expect)(items.length).to.eql(1);
        (0, chai_1.expect)(items[0].name).to.eql(name2);
        await driver.resetStorageItems();
        items = await driver.listStorageItems();
        (0, chai_1.expect)(items.length).to.eql(0);
    });
    async function addFileToStorage(sourcePath, name) {
        const hash = await support_1.fs.hash(sourcePath);
        const { size } = await support_1.fs.stat(sourcePath);
        const { ws: { events, stream }, } = await driver.addStorageItem(name, hash, sourcePath);
        const streamWs = new ws_1.WebSocket(`ws://${TEST_HOST}:${WDIO_OPTS.port}${stream}`);
        const eventsWs = new ws_1.WebSocket(`ws://${TEST_HOST}:${WDIO_OPTS.port}${events}`);
        try {
            await new Promise((resolve, reject) => {
                streamWs.once('error', reject);
                eventsWs.once('error', reject);
                eventsWs.once('message', async (data) => {
                    let strData;
                    if (Buffer.isBuffer(data)) {
                        strData = data.toString();
                    }
                    else if (typeof data === 'string') {
                        strData = data;
                    }
                    else {
                        return;
                    }
                    try {
                        const { value } = JSON.parse(strData);
                        if (value?.success) {
                            resolve();
                        }
                        else {
                            reject(new Error(JSON.stringify(value)));
                        }
                    }
                    catch {
                        // ignore
                    }
                });
                streamWs.once('open', async () => {
                    const fhandle = await support_1.fs.openFile(sourcePath, 'r');
                    try {
                        let bytesRead = 0;
                        while (bytesRead < size) {
                            const bufferSize = Math.min(BUFFER_SIZE, size - bytesRead);
                            const buffer = Buffer.alloc(bufferSize);
                            await fhandle.read(buffer, 0, bufferSize, bytesRead);
                            streamWs.send(buffer);
                            bytesRead += bufferSize;
                        }
                    }
                    catch (e) {
                        reject(e);
                    }
                    finally {
                        await fhandle.close();
                        streamWs.close();
                    }
                });
            });
        }
        finally {
            streamWs.close();
            eventsWs.close();
        }
    }
});
//# sourceMappingURL=storage.e2e.spec.js.map