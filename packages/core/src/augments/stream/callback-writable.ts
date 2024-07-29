import {Writable} from 'stream';
import {PluginLogger} from '../../plugin/plugin-logger';

export class CallbackWritable extends Writable {
    private chunks: string[] = [];

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

    constructor(private readonly logger: PluginLogger) {
        super();
    }
}