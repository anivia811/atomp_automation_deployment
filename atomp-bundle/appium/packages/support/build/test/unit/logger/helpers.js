"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWriters = setupWriters;
exports.getDynamicLogger = getDynamicLogger;
exports.restoreWriters = restoreWriters;
exports.assertOutputContains = assertOutputContains;
exports.assertOutputDoesntContain = assertOutputDoesntContain;
const sinon_1 = __importDefault(require("sinon"));
const lib_1 = require("../../../lib");
let sandbox;
function setupWriters() {
    sandbox = sinon_1.default.createSandbox();
    return {
        stdout: sandbox.spy(process.stdout, 'write'),
        stderr: sandbox.spy(process.stderr, 'write'),
    };
}
function getDynamicLogger(testingMode, forceLogs, prefix = null) {
    process.env._TESTING = testingMode ? '1' : '0';
    process.env._FORCE_LOGS = forceLogs ? '1' : '0';
    return lib_1.logger.getLogger(prefix);
}
/** Restore stubs; signature kept for API compatibility with callers that pass writers. */
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function restoreWriters(writers) {
    sandbox.restore();
}
function assertOutputContains(writers, output) {
    if (!someoneHadOutput(writers, output)) {
        throw new Error(`Expected something to have been called with: '${output}'`);
    }
}
function assertOutputDoesntContain(writers, output) {
    if (someoneHadOutput(writers, output)) {
        throw new Error(`Expected nothing to have been called with: '${output}'`);
    }
}
function someoneHadOutput(writers, output) {
    let hadOutput = false;
    const matchOutput = sinon_1.default.match(function (value) {
        return !!(value && value.indexOf(output) >= 0);
    }, 'matchOutput');
    for (const writer of Object.values(writers)) {
        if (writer.calledWithMatch) {
            hadOutput = writer.calledWithMatch(matchOutput);
            if (hadOutput) {
                break;
            }
        }
    }
    return hadOutput;
}
//# sourceMappingURL=helpers.js.map