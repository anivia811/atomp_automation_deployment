import { EventEmitter } from 'node:events';
import rewiremock from 'rewiremock';
declare class MockReadWriteStream extends EventEmitter {
    resume(): void;
    pause(): void;
    setEncoding(_encoding?: string): void;
    flush(): void;
    write(msg: string | Buffer): void;
    end(): void;
}
export { MockReadWriteStream, rewiremock };
//# sourceMappingURL=helpers.d.ts.map