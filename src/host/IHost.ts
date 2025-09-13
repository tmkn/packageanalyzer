import type { ILogger, IPackageJsonProvider } from "../index.web.js";

export interface IWriter {
    write(chunk: string): Promise<void>;
    flush(): Promise<void>;
}

export interface IHost {
    getStdoutWriter(): IWriter;
    getStderrWriter(): IWriter;
    getDefaultProvider(): IPackageJsonProvider;
    getLogger(): ILogger;
}
