"use strict";
module.exports = {
    type: 'object',
    required: ['answer'],
    properties: {
        answer: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            default: 50,
            description: 'The answer to the Ultimate Question of Life, The Universe, and Everything',
        },
    },
    $id: 'plugin.json',
};
//# sourceMappingURL=plugin-schema.js.map