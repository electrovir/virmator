import type {Logger} from '@augment-vir/common';
import {Writable} from 'node:stream';

/**
 * A [Writable](https://nodejs.org/api/stream.html#class-streamwritable) implementation that writes
 * to the provided plugin logger.
 */
export class CallbackWritable extends Writable {
    private chunks: string[] = [];

    /** Special write implementation that writs to the given logger. */
    override _write(
        chunk: any,
        encoding: BufferEncoding,
        callback: (error?: Error | null) => void,
    ): void {
        const chunkString = String(chunk);
        this.chunks.push(chunkString);
        if (chunkString.endsWith('\n')) {
            const fullString = this.chunks.join('');
            this.chunks = [];
            this.logger.faint(fullString.trim());
        }
        callback();
    }

    constructor(private readonly logger: Logger) {
        super();
    }
}
