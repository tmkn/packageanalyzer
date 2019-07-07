import * as process from "process";
import * as readline from "readline";

export function log(msg: string): void {
    process.stdout.write(msg);
}

export function clearLastLine(): void {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0, undefined);
}

export function logLastLine(msg: string): void {
    clearLastLine();
    log(msg);
}
