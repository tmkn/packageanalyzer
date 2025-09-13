import { Writable } from "node:stream";

import type { IWriter, IHost } from "./IHost.js";
import type { ILogger, IPackageJsonProvider } from "../index.web.js";
import { npmOnline } from "../providers/online.js";
import { OraLogger } from "../loggers/OraLogger.js";

export class NodeWriter implements IWriter {
    private readonly writer: WritableStreamDefaultWriter<string>;
    private pendingWrites: Promise<void>[] = [];

    constructor(nodeStream: Writable) {
        const webStream = Writable.toWeb(nodeStream);
        this.writer = webStream.getWriter();
    }

    write(chunk: string): Promise<void> {
        const writePromise = this.writer.write(chunk);

        this.pendingWrites.push(writePromise);

        return writePromise;
    }

    async flush(): Promise<void> {
        await Promise.all(this.pendingWrites);

        this.pendingWrites = [];
    }
}

export class NodeHost implements IHost {
    private readonly stdoutWriter: IWriter;
    private readonly stderrWriter: IWriter;

    constructor(
        private readonly _stdout: Writable,
        private readonly _stderr: Writable
    ) {
        this.stdoutWriter = new NodeWriter(this._stdout);
        this.stderrWriter = new NodeWriter(this._stderr);
    }

    getStdoutWriter(): IWriter {
        return this.stdoutWriter;
    }

    getStderrWriter(): IWriter {
        return this.stderrWriter;
    }

    getDefaultProvider(): IPackageJsonProvider {
        return npmOnline;
    }

    getLogger(): ILogger {
        return new OraLogger();
    }
}
