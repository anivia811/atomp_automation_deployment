"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPort = exports.pluginE2EHarness = void 0;
var harness_1 = require("./harness");
Object.defineProperty(exports, "pluginE2EHarness", { enumerable: true, get: function () { return harness_1.pluginE2EHarness; } });
Object.defineProperty(exports, "getPort", { enumerable: true, get: function () { return harness_1.getPort; } });
// Handle smoke test flag
if (require.main === module && process.argv[2] === '--smoke-test') {
    process.exit(0);
}
//# sourceMappingURL=index.js.map