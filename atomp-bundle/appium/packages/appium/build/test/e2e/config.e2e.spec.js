"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sinon_1 = require("sinon");
const build_1 = require("../../lib/helpers/build");
const axios_1 = __importDefault(require("axios"));
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const teenProcess = __importStar(require("teen_process"));
const { expect } = chai_1.default;
chai_1.default.use(chai_as_promised_1.default);
describe('Config', function () {
    let sandbox;
    beforeEach(function () {
        sandbox = (0, sinon_1.createSandbox)();
    });
    afterEach(function () {
        sandbox.verify();
        sandbox.restore();
    });
    describe('getGitRev', function () {
        it('should get a reasonable git revision', async function () {
            const rev = await (0, build_1.getGitRev)();
            expect(rev).to.be.a('string');
            expect(rev).to.not.be.null;
            expect(rev.length).to.equal(40);
            expect(rev.match(/[0-9a-f]+/i)[0]).to.eql(rev);
        });
    });
    describe('getBuildInfo', function () {
        const SHA = 'a7404fddd50ee1c6ff1aac3d2f259abab0d3291a';
        const DATE = '2022-06-04T02:08:17Z';
        async function verifyBuildInfoUpdate(useLocalGit, opts = {}) {
            const buildInfo = (0, build_1.getBuildInfo)();
            const { sha, built } = opts;
            const innerExecStub = sandbox.stub().throws();
            if (!useLocalGit) {
                sandbox.stub(teenProcess, 'exec').get(() => innerExecStub);
            }
            buildInfo['git-sha'] = undefined;
            buildInfo.built = undefined;
            await (0, build_1.updateBuildInfo)(true);
            expect(buildInfo).to.be.an('object');
            if (sha) {
                expect(buildInfo['git-sha']).to.equal(sha);
            }
            else {
                expect(buildInfo['git-sha']).to.exist;
            }
            if (built) {
                expect(buildInfo.built).to.equal(built);
            }
            else {
                expect(buildInfo.built).to.exist;
            }
            expect(buildInfo.version).to.exist;
            if (!useLocalGit) {
                expect(innerExecStub.callCount).to.be.at.least(1);
            }
        }
        let getStub;
        beforeEach(function () {
            getStub = sandbox.stub(axios_1.default, 'get');
        });
        afterEach(function () {
            getStub.restore();
        });
        it('should get a configuration object if the local git metadata is present', async function () {
            await verifyBuildInfoUpdate(true);
        });
        it('should get a configuration object if the local git metadata is not present', async function () {
            getStub.onCall(0).returns({
                data: {
                    ref: `refs/tags/appium@${build_1.APPIUM_VER}`,
                    node_id: 'MDM6UmVmNzUzMDU3MDpyZWZzL3RhZ3MvYXBwaXVtQDIuMC4wLWJldGEuNDA=',
                    url: `https://api.github.com/repos/appium/appium/git/refs/tags/appium@${build_1.APPIUM_VER}`,
                    object: {
                        sha: SHA,
                        type: 'tag',
                        url: `https://api.github.com/repos/appium/appium/git/tags/${SHA}`,
                    },
                },
            });
            getStub.onCall(1).returns({
                data: {
                    node_id: 'TA_kwDOAHLoStoAKGE3NDA0ZmRkZDUwZWUxYzZmZjFhYWMzZDJmMjU5YWJhYjBkMzI5MWE',
                    sha: SHA,
                    url: `https://api.github.com/repos/appium/appium/git/tags/${SHA}`,
                    tagger: {
                        name: 'Jonathan Lipps',
                        email: 'jlipps@gmail.com',
                        date: DATE,
                    },
                    object: {
                        sha: '4cf2cc92d066ed32adda27e0439547290a4b71ce',
                        type: 'commit',
                        url: 'https://api.github.com/repos/appium/appium/git/commits/4cf2cc92d066ed32adda27e0439547290a4b71ce',
                    },
                    tag: `appium@${build_1.APPIUM_VER}`,
                    message: `appium@${build_1.APPIUM_VER}\n`,
                    verification: {
                        verified: false,
                        reason: 'unsigned',
                        signature: null,
                        payload: null,
                    },
                },
            });
            await verifyBuildInfoUpdate(false, { sha: SHA, built: DATE });
        });
    });
});
//# sourceMappingURL=config.e2e.spec.js.map