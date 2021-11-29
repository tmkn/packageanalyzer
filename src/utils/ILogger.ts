export interface ILogger {
    start: () => void;
    stop: () => void;
    log: (msg: string) => void;
    error: (msg: string) => void;
}

export function numPadding(i: number, total: number): string {
    const digits = total.toString().length;
    const iPadding = `${i + 1}`.padStart(digits);

    return `${iPadding}/${total}`;
}
