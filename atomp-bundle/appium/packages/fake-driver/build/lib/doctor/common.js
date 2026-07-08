"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvVarAndPathCheck = void 0;
const support_1 = require("appium/support");
class EnvVarAndPathCheck {
    varName;
    log;
    constructor(varName) {
        this.varName = varName;
    }
    async diagnose() {
        return support_1.doctor.ok(`${this.varName} environment variable is always set because it's fake`);
    }
    async fix() {
        return `Make sure the environment variable ${this.varName} is properly configured for the Appium server process`;
    }
    hasAutofix() {
        return false;
    }
    isOptional() {
        return false;
    }
}
exports.EnvVarAndPathCheck = EnvVarAndPathCheck;
//# sourceMappingURL=common.js.map