import type { ILogger } from "../loggers/ILogger.js";
import type { IPackageJsonProvider } from "../providers/provider.js";

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
