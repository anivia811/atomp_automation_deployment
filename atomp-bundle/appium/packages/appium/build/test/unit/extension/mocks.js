"use strict";
/**
 * A collection of mocks reused across unit tests.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMocks = initMocks;
const node_events_1 = require("node:events");
const node_path_1 = __importDefault(require("node:path"));
const sinon_1 = require("sinon");
const support_1 = require("@appium/support");
function initMocks(sandbox = (0, sinon_1.createSandbox)()) {
    const MockAppiumSupport = {
        fs: {
            readFile: sandbox.stub().resolves('{}'),
            writeFile: sandbox.stub().resolves(true),
            walk: sandbox.stub().returns({
                [Symbol.asyncIterator]: sandbox
                    .stub()
                    .returns({ next: sandbox.stub().resolves({ done: true }) }),
            }),
            glob: sandbox.stub().resolves([]),
            mkdirp: sandbox.stub().resolves(),
            exists: sandbox.stub().resolves(true),
        },
        env: {
            resolveAppiumHome: sandbox.stub().resolves('/some/path'),
            resolveManifestPath: sandbox.stub().resolves('/some/path/extensions.yaml'),
            hasAppiumDependency: sandbox.stub().resolves(false),
            readPackageInDir: sandbox.stub().callsFake(async () => MockAppiumSupport.env.__pkg),
            __pkg: {
                name: 'mock-package',
                version: '1.0.0',
                readme: '# Mock Package!!',
                _id: 'mock-package',
            },
        },
        logger: {
            getLogger: sandbox.stub().callsFake(() => MockAppiumSupport.logger.__logger),
            __logger: sandbox.stub(new global.console.Console(process.stdout, process.stderr)),
        },
        system: {
            isWindows: sandbox.stub().returns(false),
        },
        npm: {
            getLatestVersion: sandbox.stub().resolves('2.0.0'),
            getLatestSafeUpgradeVersion: sandbox.stub().resolves('1.1.0'),
        },
        util: {
            ...support_1.util,
            compareVersions: sandbox.stub().returns(true),
        },
        console: {
            CliConsole: sandbox.stub().returns(sandbox.createStubInstance(support_1.console.CliConsole)),
        },
    };
    const MockPackageChanged = {
        isPackageChanged: sandbox.stub().callsFake(async () => ({
            isChanged: true,
            writeHash: MockPackageChanged.__writeHash,
            hash: 'some-hash',
            oldHash: 'some-old-hash',
        })),
        __writeHash: sandbox.stub(),
    };
    const MockResolveFrom = sandbox
        .stub()
        .callsFake(async (cwd, id) => node_path_1.default.join(cwd, id));
    const MockGlob = sandbox
        .stub()
        .callsFake((spec, opts, done) => {
        const ee = new node_events_1.EventEmitter();
        setTimeout(() => {
            ee.emit('match', node_path_1.default.join(opts.cwd, 'package.json'));
            setTimeout(() => {
                done();
            });
        });
        return ee;
    });
    const overrides = {
        '@appium/support': MockAppiumSupport,
        '../../../lib/utils/resolve-from': { resolveFrom: MockResolveFrom },
        '../../../lib/utils/is-package-changed': MockPackageChanged,
        glob: MockGlob,
    };
    return {
        MockAppiumSupport,
        MockPackageChanged,
        MockResolveFrom,
        MockGlob,
        sandbox,
        overrides,
    };
}
//# sourceMappingURL=mocks.js.map