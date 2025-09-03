import type { ILogger, IPackageJsonProvider } from "../index.web.js";

export interface IAsyncWriter {
    write(chunk: string): Promise<void>;
    flush(): Promise<void>;
}

export interface IHost {
    getStdout(): IAsyncWriter;
    getStderr(): IAsyncWriter;
    getDefaultProvider(): IPackageJsonProvider;
    getLogger(): ILogger;
}
