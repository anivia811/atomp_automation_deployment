"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NEW_BIDI_COMMANDS = void 0;
exports.NEW_BIDI_COMMANDS = {
    'appium:fake': {
        getFakeThing: {
            command: 'getFakeThing',
        },
        setFakeThing: {
            command: 'setFakeThing',
            params: {
                required: ['thing'],
            },
        },
        doSomeMath: {
            command: 'doSomeMath',
            params: {
                required: ['num1', 'num2'],
            },
        },
        doSomeMath2: {
            command: 'doSomeMath2',
            params: {
                required: ['num1', 'num2'],
            },
        },
    },
};
//# sourceMappingURL=new-bidi-commands.js.map