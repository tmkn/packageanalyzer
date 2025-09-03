import { Writable } from "node:stream";

import type { IAsyncWriter, IHost } from "./IHost.js";
import type { ILogger, IPackageJsonProvider } from "../index.web.js";
import { npmOnline } from "../providers/online.js";
import { OraLogger } from "../loggers/OraLogger.js";

export class NodeAsyncWriter implements IAsyncWriter {
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
    private _asyncStdout: IAsyncWriter;
    private _asyncStderr: IAsyncWriter;

    constructor(
        private _stdout: Writable,
        private _stderr: Writable
    ) {
        this._asyncStdout = new NodeAsyncWriter(this._stdout);
        this._asyncStderr = new NodeAsyncWriter(this._stderr);
    }

    getStdout(): IAsyncWriter {
        return this._asyncStdout;
    }

    getStderr(): IAsyncWriter {
        return this._asyncStderr;
    }

    getDefaultProvider(): IPackageJsonProvider {
        return npmOnline;
    }

    getLogger(): ILogger {
        return new OraLogger();
    }
}
