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
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewiremock = exports.MockReadWriteStream = void 0;
const node_events_1 = require("node:events");
const rewiremock_1 = __importStar(require("rewiremock"));
exports.rewiremock = rewiremock_1.default;
(0, rewiremock_1.overrideEntryPoint)(module);
(0, rewiremock_1.addPlugin)(rewiremock_1.plugins.nodejs);
class MockReadWriteStream extends node_events_1.EventEmitter {
    resume() { }
    pause() { }
    // Signature required by stream interface; encoding not used in mock.
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    setEncoding(_encoding) { }
    flush() { }
    write(msg) {
        this.emit('data', msg);
    }
    end() {
        this.emit('end');
        this.emit('finish');
    }
}
exports.MockReadWriteStream = MockReadWriteStream;
//# sourceMappingURL=helpers.js.map