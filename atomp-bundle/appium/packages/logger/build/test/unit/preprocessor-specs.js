"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const secure_values_preprocessor_1 = require("../../lib/secure-values-preprocessor");
describe('Log Internals', function () {
    let preprocessor;
    beforeEach(function () {
        preprocessor = new secure_values_preprocessor_1.SecureValuesPreprocessor();
    });
    it('should preprocess a string and make replacements', async function () {
        const issues = await preprocessor.loadRules(['yolo']);
        (0, chai_1.expect)(issues.length).to.eql(0);
        (0, chai_1.expect)(preprocessor.rules.length).to.eql(1);
        const replacer = preprocessor.rules[0].replacer;
        (0, chai_1.expect)(preprocessor.preprocess(':yolo" yo Yolo yyolo')).to.eql(`:${replacer}" yo Yolo yyolo`);
    });
    it('should preprocess a string and make replacements with multiple simple rules', async function () {
        const issues = await preprocessor.loadRules(['yolo', 'yo']);
        (0, chai_1.expect)(issues.length).to.eql(0);
        (0, chai_1.expect)(preprocessor.rules.length).to.eql(2);
        const replacer = preprocessor.rules[0].replacer;
        (0, chai_1.expect)(preprocessor.preprocess(':yolo" yo Yolo yyolo')).to.eql(`:${replacer}" ${replacer} Yolo yyolo`);
    });
    it('should preprocess a string and make replacements with multiple complex rules', async function () {
        const replacer2 = '***';
        const issues = await preprocessor.loadRules([
            { text: 'yolo', flags: 'i' },
            { pattern: '^:', replacer: replacer2 },
        ]);
        (0, chai_1.expect)(issues.length).to.eql(0);
        (0, chai_1.expect)(preprocessor.rules.length).to.eql(2);
        const replacer = preprocessor.rules[0].replacer;
        (0, chai_1.expect)(preprocessor.preprocess(':yolo" yo Yolo yyolo')).to.eql(`${replacer2}${replacer}" yo ${replacer} yyolo`);
    });
    it(`should preprocess a string and apply a rule where 'pattern' has priority over 'text'`, async function () {
        const replacer = '***';
        const issues = await preprocessor.loadRules([{ pattern: '^:', text: 'yo', replacer }]);
        (0, chai_1.expect)(issues.length).to.eql(0);
        (0, chai_1.expect)(preprocessor.rules.length).to.eql(1);
        (0, chai_1.expect)(preprocessor.preprocess(':yolo" yo Yolo yyolo')).to.eql(`${replacer}yolo" yo Yolo yyolo`);
    });
    it('should preprocess a string and make replacements with multiple complex rules and issues', async function () {
        const replacer2 = '***';
        const issues = await preprocessor.loadRules([
            { text: 'yolo', flags: 'i' },
            { pattern: '^:(', replacer: replacer2 },
        ]);
        (0, chai_1.expect)(issues.length).to.eql(1);
        (0, chai_1.expect)(preprocessor.rules.length).to.eql(1);
        const replacer = preprocessor.rules[0].replacer;
        (0, chai_1.expect)(preprocessor.preprocess(':yolo" yo Yolo yyolo')).to.eql(`:${replacer}" yo ${replacer} yyolo`);
    });
    it('should leave the string unchanged if all rules have issues', async function () {
        const replacer2 = '***';
        const issues = await preprocessor.loadRules([
            null,
            { flags: 'i' },
            { pattern: '^:(', replacer: replacer2 },
        ]);
        (0, chai_1.expect)(issues.length).to.eql(3);
        (0, chai_1.expect)(preprocessor.rules.length).to.eql(0);
        (0, chai_1.expect)(preprocessor.preprocess(':yolo" yo Yolo yyolo')).to.eql(':yolo" yo Yolo yyolo');
    });
});
//# sourceMappingURL=preprocessor-specs.js.map