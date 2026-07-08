"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformSourceXml = exports.UniversalXMLPlugin = void 0;
exports.main = main;
var plugin_1 = require("./plugin");
Object.defineProperty(exports, "UniversalXMLPlugin", { enumerable: true, get: function () { return plugin_1.UniversalXMLPlugin; } });
var source_1 = require("./source");
Object.defineProperty(exports, "transformSourceXml", { enumerable: true, get: function () { return source_1.transformSourceXml; } });
const promises_1 = __importDefault(require("node:fs/promises"));
const source_2 = require("./source");
const plugin_2 = require("./plugin");
exports.default = plugin_2.UniversalXMLPlugin;
/**
 * CLI entrypoint for transforming source XML.
 */
async function main() {
    const [, , xmlDataPath, platform, optsJson] = process.argv;
    // Handle smoke test flag
    if (xmlDataPath === '--smoke-test') {
        // Module loaded successfully, exit with code 0
        process.exit(0);
    }
    if (!xmlDataPath || !platform) {
        console.error('Usage: node index.js <xmlDataPath> <platform> [optsJson]'); // eslint-disable-line no-console
        process.exit(1);
    }
    const xmlData = await promises_1.default.readFile(xmlDataPath, 'utf8');
    const opts = optsJson ? JSON.parse(optsJson) : {};
    const { xml, unknowns } = await (0, source_2.transformSourceXml)(xmlData, platform, opts);
    console.log(xml); // eslint-disable-line no-console
    if (unknowns.nodes.length || unknowns.attrs.length) {
        console.error(unknowns); // eslint-disable-line no-console
    }
}
if (require.main === module) {
    void main();
}
//# sourceMappingURL=index.js.map