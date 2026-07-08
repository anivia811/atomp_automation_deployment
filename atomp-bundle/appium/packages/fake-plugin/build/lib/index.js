"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakePlugin = void 0;
var plugin_1 = require("./plugin");
Object.defineProperty(exports, "FakePlugin", { enumerable: true, get: function () { return plugin_1.FakePlugin; } });
// Handle smoke test flag
if (require.main === module && process.argv[2] === '--smoke-test') {
    process.exit(0);
}
//# sourceMappingURL=index.js.map