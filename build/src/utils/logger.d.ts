import { ILogger } from "./ILogger";
export declare class OraLogger implements ILogger {
    private _logger;
    start(): void;
    stop(): void;
    log(msg: string): void;
    error(msg: string): void;
}
export declare function numPadding(i: number, total: number): string;
//# sourceMappingURL=logger.d.ts.map