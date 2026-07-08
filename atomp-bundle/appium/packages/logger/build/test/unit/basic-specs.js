"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const chai_1 = require("chai");
const log_1 = require("../../lib/log");
const node_stream_1 = require("node:stream");
describe('basic', function () {
    let log;
    describe('logging', function () {
        let s;
        let result = [];
        let logEvents = [];
        let logInfoEvents = [];
        let logPrefixEvents = [];
        const resultExpect = [
            '\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[7msill\u001b[0m \u001b[0m\u001b[35msilly prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
            '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[36;40mverb\u001b[0m \u001b[0m\u001b[35mverbose prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
            '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[32minfo\u001b[0m \u001b[0m\u001b[35minfo prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
            '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[32;40mtiming\u001b[0m \u001b[0m\u001b[35mtiming prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
            '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[32;40mhttp\u001b[0m \u001b[0m\u001b[35mhttp prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
            '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[36;40mnotice\u001b[0m \u001b[0m\u001b[35mnotice prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
            '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[30;43mWARN\u001b[0m \u001b[0m\u001b[35mwarn prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
            '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[31;40mERR!\u001b[0m \u001b[0m\u001b[35merror prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
            '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[32minfo\u001b[0m \u001b[0m\u001b[35minfo prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
            '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[32;40mtiming\u001b[0m \u001b[0m\u001b[35mtiming prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
            '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[32;40mhttp\u001b[0m \u001b[0m\u001b[35mhttp prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
            '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[36;40mnotice\u001b[0m \u001b[0m\u001b[35mnotice prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
            '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[30;43mWARN\u001b[0m \u001b[0m\u001b[35mwarn prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
            '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[31;40mERR!\u001b[0m \u001b[0m\u001b[35merror prefix\u001b[0m x = {"foo":{"bar":"baz"}}\n',
            '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[31;40mERR!\u001b[0m \u001b[0m\u001b[35m404\u001b[0m This is a longer\n',
            '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[31;40mERR!\u001b[0m \u001b[0m\u001b[35m404\u001b[0m message, with some details\n',
            '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[31;40mERR!\u001b[0m \u001b[0m\u001b[35m404\u001b[0m and maybe a stack.\n',
            '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u001b[31;40mERR!\u001b[0m \u001b[0m\u001b[35m404\u001b[0m \n',
            '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u0007noise\u001b[0m\u001b[35m\u001b[0m LOUD NOISES\n',
            '\u001b[0m\u001b[37;40mnpm\u001b[0m \u001b[0m\u0007noise\u001b[0m \u001b[0m\u001b[35merror\u001b[0m erroring\n',
            '\u001b[0m',
        ];
        const logPrefixEventsExpect = [
            { id: 2, level: 'info', prefix: 'info prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 11, level: 'info', prefix: 'info prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 20, level: 'info', prefix: 'info prefix', message: 'x = {"foo":{"bar":"baz"}}' },
        ];
        const logInfoEventsExpect = logPrefixEventsExpect;
        const logEventsExpect = [
            { id: 0, level: 'silly', prefix: 'silly prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 1, level: 'verbose', prefix: 'verbose prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 2, level: 'info', prefix: 'info prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 3, level: 'timing', prefix: 'timing prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 4, level: 'http', prefix: 'http prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 5, level: 'notice', prefix: 'notice prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 6, level: 'warn', prefix: 'warn prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 7, level: 'error', prefix: 'error prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 8, level: 'silent', prefix: 'silent prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 9, level: 'silly', prefix: 'silly prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 10, level: 'verbose', prefix: 'verbose prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 11, level: 'info', prefix: 'info prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 12, level: 'timing', prefix: 'timing prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 13, level: 'http', prefix: 'http prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 14, level: 'notice', prefix: 'notice prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 15, level: 'warn', prefix: 'warn prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 16, level: 'error', prefix: 'error prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 17, level: 'silent', prefix: 'silent prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 18, level: 'silly', prefix: 'silly prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 19, level: 'verbose', prefix: 'verbose prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 20, level: 'info', prefix: 'info prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 21, level: 'timing', prefix: 'timing prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 22, level: 'http', prefix: 'http prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 23, level: 'notice', prefix: 'notice prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 24, level: 'warn', prefix: 'warn prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 25, level: 'error', prefix: 'error prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            { id: 26, level: 'silent', prefix: 'silent prefix', message: 'x = {"foo":{"bar":"baz"}}' },
            {
                id: 27,
                level: 'error',
                prefix: '404',
                message: 'This is a longer\nmessage, with some details\nand maybe a stack.\n',
            },
            { id: 28, level: 'noise', prefix: '', message: 'LOUD NOISES' },
            { id: 29, level: 'noise', prefix: 'error', message: 'erroring' },
        ];
        beforeEach(function () {
            result = [];
            logEvents = [];
            logInfoEvents = [];
            logPrefixEvents = [];
            log = new log_1.Log();
            s = Object.assign(new node_stream_1.Stream(), {
                write: (m) => result.push(m),
                writable: true,
                isTTY: true,
                end: () => { },
            });
            log.stream = s;
            log.heading = 'npm';
        });
        it('should work', function () {
            (0, chai_1.expect)(log.stream).to.equal(s);
            log.on('log', logEvents.push.bind(logEvents));
            log.on('log.info', logInfoEvents.push.bind(logInfoEvents));
            log.on('info prefix', logPrefixEvents.push.bind(logPrefixEvents));
            console.error('log.level=silly');
            log.level = 'silly';
            log.silly('silly prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.verbose('verbose prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.info('info prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.timing('timing prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.http('http prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.notice('notice prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.warn('warn prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.error('error prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.silent('silent prefix', 'x = %j', { foo: { bar: 'baz' } });
            console.error('log.level=silent');
            log.level = 'silent';
            log.silly('silly prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.verbose('verbose prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.info('info prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.timing('timing prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.http('http prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.notice('notice prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.warn('warn prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.error('error prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.silent('silent prefix', 'x = %j', { foo: { bar: 'baz' } });
            console.error('log.level=info');
            log.level = 'info';
            log.silly('silly prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.verbose('verbose prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.info('info prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.timing('timing prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.http('http prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.notice('notice prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.warn('warn prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.error('error prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.silent('silent prefix', 'x = %j', { foo: { bar: 'baz' } });
            log.error('404', 'This is a longer\nmessage, with some details\nand maybe a stack.\n');
            log.addLevel('noise', 10000, { bell: true });
            log.noise(false, 'LOUD NOISES');
            log.noise('error', 'erroring');
            (0, chai_1.expect)(result.join('').trim()).to.equal(resultExpect.join('').trim());
            const withoutTimestamps = (x) => x.map((m) => {
                (0, chai_1.expect)(Boolean(m.timestamp)).to.be.true;
                const copy = JSON.parse(JSON.stringify(m));
                delete copy.timestamp;
                return copy;
            });
            (0, chai_1.expect)(withoutTimestamps(log.record)).to.eql(logEventsExpect);
            (0, chai_1.expect)(withoutTimestamps(logEvents)).to.eql(logEventsExpect);
            (0, chai_1.expect)(withoutTimestamps(logInfoEvents)).to.eql(logInfoEventsExpect);
            (0, chai_1.expect)(withoutTimestamps(logPrefixEvents)).to.eql(logPrefixEventsExpect);
        });
    });
    describe('utils', function () {
        it('enableColor', function () {
            log.enableColor();
            (0, chai_1.expect)(log._format('x', { fg: 'red' })).to.include('\u001b');
        });
        it('disableColor', function () {
            log.disableColor();
            (0, chai_1.expect)(log._format('x', { fg: 'red' })).to.equal('x');
        });
        it('_buffer while paused', function () {
            log.pause();
            log.log('verbose', 'test', 'test log');
            (0, chai_1.expect)(log._buffer.length).to.equal(1);
            log.resume();
            (0, chai_1.expect)(log._buffer.length).to.equal(0);
        });
    });
    describe('log.log', function () {
        beforeEach(function () {
            log = new log_1.Log();
        });
        it('emits error on bad loglevel', async function () {
            await new Promise((resolve, reject) => {
                log.once('error', (err) => {
                    (0, chai_1.expect)(/Undefined log level: "asdf"/.test(String(err))).to.be.true;
                    resolve();
                });
                log.log('asdf', '', 'bad loglevel');
                setTimeout(() => reject(new Error('timeout')), 1000);
            });
        });
        it('resolves stack traces to a plain string', async function () {
            await new Promise((resolve, reject) => {
                log.once('log', (m) => {
                    (0, chai_1.expect)(/Error: with a stack trace/.test(m.message)).to.be.true;
                    (0, chai_1.expect)(/at Test/.test(m.message)).to.be.true;
                    resolve();
                });
                const err = new Error('with a stack trace');
                log.log('verbose', 'oops', err);
                setTimeout(() => reject(new Error('timeout')), 1000);
            });
        });
        it('replaces sensitive messages', async function () {
            log.updateAsyncStorage({ isSensitive: true }, true);
            log.log('verbose', 'test', (0, log_1.markSensitive)('log 1'));
            (0, chai_1.expect)(log.record.at(-1).message).to.eql('**SECURE**');
            log.updateAsyncStorage({ isSensitive: false }, true);
            log.log('verbose', 'test', (0, log_1.markSensitive)('log 1'));
            (0, chai_1.expect)(log.record.at(-1).message).to.eql('log 1');
        });
        it('max record size', function () {
            log.maxRecordSize = 3;
            log.log('verbose', 'test', 'log 1');
            log.log('verbose', 'test', 'log 2');
            log.log('verbose', 'test', 'log 3');
            log.log('verbose', 'test', 'log 4');
            (0, chai_1.expect)(log.record.map(({ message }) => message)).to.eql(['log 2', 'log 3', 'log 4']);
            log.maxRecordSize = 2;
            log.log('verbose', 'test', 'log 5');
            (0, chai_1.expect)(log.record.map(({ message }) => message)).to.eql(['log 4', 'log 5']);
            log.maxRecordSize = 3;
            log.log('verbose', 'test', 'log 6');
            (0, chai_1.expect)(log.record.map(({ message }) => message)).to.eql(['log 4', 'log 5', 'log 6']);
        });
    });
    describe('stream', function () {
        beforeEach(function () {
            log = new log_1.Log();
        });
        it('write with no stream', function () {
            log.stream = null;
            log.write('message');
        });
    });
    describe('emitLog', function () {
        beforeEach(function () {
            log = new log_1.Log();
        });
        it('to nonexistent level', function () {
            log.emitLog({ prefix: 'test', level: 'asdf' });
        });
    });
    describe('format', function () {
        beforeEach(function () {
            log = new log_1.Log();
        });
        it('with nonexistent stream', function () {
            log.stream = null;
            (0, chai_1.expect)(log._format('message')).to.equal(undefined);
        });
        it('fg', function () {
            log.enableColor();
            const o = log._format('test message', { bg: 'blue' });
            (0, chai_1.expect)(o).to.include('\u001b[44mtest message\u001b[0m');
        });
        it('bg', function () {
            log.enableColor();
            const o = log._format('test message', { bg: 'white' });
            (0, chai_1.expect)(o).to.include('\u001b[47mtest message\u001b[0m');
        });
        it('bold', function () {
            log.enableColor();
            const o = log._format('test message', { bold: true });
            (0, chai_1.expect)(o).to.include('\u001b[1mtest message\u001b[0m');
        });
        it('underline', function () {
            log.enableColor();
            const o = log._format('test message', { underline: true });
            (0, chai_1.expect)(o).to.include('\u001b[4mtest message\u001b[0m');
        });
        it('inverse', function () {
            log.enableColor();
            const o = log._format('test message', { inverse: true });
            (0, chai_1.expect)(o).to.include('\u001b[7mtest message\u001b[0m');
        });
    });
});
//# sourceMappingURL=basic-specs.js.map