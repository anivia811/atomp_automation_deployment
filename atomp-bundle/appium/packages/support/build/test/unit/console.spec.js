"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const consoleModule = __importStar(require("../../lib/console"));
const { CliConsole, stripColors, styleText } = consoleModule;
describe('console', function () {
    it('should expose styleText and stripColors on the module namespace', function () {
        (0, chai_1.expect)(consoleModule.styleText).to.equal(styleText);
        (0, chai_1.expect)(consoleModule.stripColors).to.equal(stripColors);
    });
    describe('styleText()', function () {
        it('should accept grey as an alias for gray', function () {
            (0, chai_1.expect)(stripColors(styleText('grey', 'muted'))).to.equal('muted');
        });
        it('should strip ANSI sequences from styled text', function () {
            (0, chai_1.expect)(stripColors(styleText('red', 'error'))).to.equal('error');
        });
        it('should leave plain text unchanged when stripping', function () {
            (0, chai_1.expect)(stripColors('plain')).to.equal('plain');
        });
        it('should strip non-SGR CSI sequences', function () {
            (0, chai_1.expect)(stripColors('hello\x1b[2Kworld')).to.equal('helloworld');
            (0, chai_1.expect)(stripColors('before\x1b[1Gafter')).to.equal('beforeafter');
        });
    });
    describe('CliConsole', function () {
        describe('decorate()', function () {
            it('should return undefined for undefined input', function () {
                const cli = new CliConsole();
                (0, chai_1.expect)(cli.decorate(undefined, 'info')).to.be.undefined;
            });
            it('should return the message unchanged when symbols are disabled', function () {
                const cli = new CliConsole({ useSymbols: false });
                (0, chai_1.expect)(cli.decorate('hello', 'success')).to.equal('hello');
            });
            it('should prefix the message with a symbol', function () {
                const cli = new CliConsole({ useColor: false });
                const decorated = cli.decorate('done', 'success');
                (0, chai_1.expect)(decorated).to.match(/^.\s+done$/);
            });
            it('should colorize when useColor is enabled', function () {
                const cli = new CliConsole({ useColor: true });
                const decorated = cli.decorate('done', 'success');
                (0, chai_1.expect)(stripColors(decorated)).to.match(/^.\s+done$/);
            });
            describe('when useColor is defaulted from the environment', function () {
                const originalEnv = { ...process.env };
                afterEach(function () {
                    process.env = { ...originalEnv };
                });
                it('should not colorize when NO_COLOR is set', function () {
                    process.env.NO_COLOR = '1';
                    delete process.env.FORCE_COLOR;
                    const cli = new CliConsole();
                    const decorated = cli.decorate('done', 'success');
                    (0, chai_1.expect)(decorated).to.equal(stripColors(decorated));
                });
                it('should not colorize when FORCE_COLOR is false regardless of case', function () {
                    delete process.env.NO_COLOR;
                    process.env.FORCE_COLOR = 'FALSE';
                    const cli = new CliConsole();
                    const decorated = cli.decorate('done', 'success');
                    (0, chai_1.expect)(decorated).to.equal(stripColors(decorated));
                });
                it('should colorize when FORCE_COLOR is set', function () {
                    delete process.env.NO_COLOR;
                    process.env.FORCE_COLOR = '1';
                    const cli = new CliConsole({ useColor: undefined });
                    const decorated = cli.decorate('done', 'success');
                    (0, chai_1.expect)(stripColors(decorated)).to.match(/^.\s+done$/);
                });
            });
        });
        it('should map symbols to the expected colors', function () {
            (0, chai_1.expect)(CliConsole.symbolToColor).to.eql({
                success: 'green',
                info: 'cyan',
                warning: 'yellow',
                error: 'red',
            });
        });
    });
});
//# sourceMappingURL=console.spec.js.map