"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ora_1 = __importDefault(require("ora"));
const spinner = (0, ora_1.default)('Running fake-error...').start();
setTimeout(() => {
    spinner.fail('Oh nooooooo!');
    throw Error('Unsuccessfully ran the script');
}, 1000);
//# sourceMappingURL=fake-error.js.map