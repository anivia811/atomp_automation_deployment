"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_readline_1 = __importDefault(require("node:readline"));
const rl = node_readline_1.default.createInterface({ input: process.stdin, output: process.stderr });
rl.question('Press ENTER to continue: ', () => {
    rl.close();
    // eslint-disable-next-line no-console
    console.error('You did it!');
});
//# sourceMappingURL=fake-stdin.js.map