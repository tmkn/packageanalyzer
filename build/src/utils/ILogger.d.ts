export interface ILogger {
    start: () => void;
    stop: () => void;
    log: (msg: string) => void;
    error: (msg: string) => void;
}
export declare function numPadding(i: number, total: number): string;
//# sourceMappingURL=Ilogger.d.ts.map