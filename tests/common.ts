import { Writable } from "stream";

export class TestWritable extends Writable {
    public lines: string[] = [];

    _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        const data: string = chunk.toString();

        if (data.endsWith(`\n`)) this.lines.push(data.slice(0, data.length - 1));
        else this.lines.push(data);

        callback();
    }
}
