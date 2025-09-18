export interface ILogger {
    start: () => void;
    stop: () => void;
    log: (msg: string) => void;
    error: (msg: string) => void;
}
