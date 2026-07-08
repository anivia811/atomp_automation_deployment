"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelaxedCapsPlugin = void 0;
var plugin_1 = require("./plugin");
Object.defineProperty(exports, "RelaxedCapsPlugin", { enumerable: true, get: function () { return plugin_1.RelaxedCapsPlugin; } });
// Handle smoke test flag
if (require.main === module && process.argv[2] === '--smoke-test') {
    process.exit(0);
}
//# sourceMappingURL=index.js.map