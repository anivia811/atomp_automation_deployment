"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const base64_encode_stream_1 = require("../../../lib/internal/base64-encode-stream");
function splitIntoChunks(data, chunkSize) {
    const chunks = [];
    for (let offset = 0; offset < data.length; offset += chunkSize) {
        chunks.push(data.subarray(offset, offset + chunkSize));
    }
    return chunks;
}
function encodeChunks(chunks) {
    return new Promise((resolve, reject) => {
        const encoder = (0, base64_encode_stream_1.createBase64EncodeStream)();
        const parts = [];
        encoder.on('data', (chunk) => parts.push(chunk));
        encoder.on('error', reject);
        encoder.on('finish', () => resolve(Buffer.concat(parts).toString('utf8')));
        for (const chunk of chunks) {
            encoder.write(chunk);
        }
        encoder.end();
    });
}
describe('internal/base64-encode-stream', function () {
    describe('createBase64EncodeStream()', function () {
        it('should emit Buffer chunks', async function () {
            const encoder = (0, base64_encode_stream_1.createBase64EncodeStream)();
            const chunks = [];
            encoder.on('data', (chunk) => chunks.push(chunk));
            encoder.end(Buffer.from('hello'));
            await new Promise((resolve) => encoder.on('finish', () => resolve()));
            (0, chai_1.expect)(chunks.length).to.be.greaterThan(0);
            (0, chai_1.expect)(chunks.every((chunk) => Buffer.isBuffer(chunk))).to.equal(true);
        });
        it('should encode an empty stream', async function () {
            (0, chai_1.expect)(await encodeChunks([])).to.equal('');
        });
        it('should encode a single chunk', async function () {
            const input = Buffer.from('hello world');
            (0, chai_1.expect)(await encodeChunks([input])).to.equal(input.toString('base64'));
        });
        it('should encode input split into single-byte chunks', async function () {
            const input = Buffer.from('The quick brown fox jumps over the lazy dog');
            const encoded = await encodeChunks(splitIntoChunks(input, 1));
            (0, chai_1.expect)(encoded).to.equal(input.toString('base64'));
        });
        it('should encode input split into chunks that are not multiples of three bytes', async function () {
            const input = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
            for (const chunkSize of [1, 2, 4, 5, 7]) {
                const encoded = await encodeChunks(splitIntoChunks(input, chunkSize));
                (0, chai_1.expect)(encoded, `chunk size ${chunkSize}`).to.equal(input.toString('base64'));
            }
        });
        it('should flush trailing bytes that do not complete a base64 triplet', async function () {
            const oneByte = Buffer.from('a');
            const twoBytes = Buffer.from('ab');
            (0, chai_1.expect)(await encodeChunks([oneByte])).to.equal(oneByte.toString('base64'));
            (0, chai_1.expect)(await encodeChunks([twoBytes])).to.equal(twoBytes.toString('base64'));
            (0, chai_1.expect)(await encodeChunks(splitIntoChunks(twoBytes, 1))).to.equal(twoBytes.toString('base64'));
        });
        it('should match Buffer base64 encoding for varied payload lengths', async function () {
            const payloads = [
                Buffer.alloc(0),
                Buffer.from('x'),
                Buffer.from('xy'),
                Buffer.from('xyz'),
                Buffer.alloc(256, 0xab),
                Buffer.from('0123456789abcdef', 'hex'),
            ];
            for (const payload of payloads) {
                const encoded = await encodeChunks(splitIntoChunks(payload, 3));
                (0, chai_1.expect)(encoded, `payload length ${payload.length}`).to.equal(payload.toString('base64'));
            }
        });
    });
});
//# sourceMappingURL=base64-encode-stream.spec.js.map