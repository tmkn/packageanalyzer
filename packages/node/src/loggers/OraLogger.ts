import ora, { type Ora } from "ora";

import { type ILogger } from "../../../shared/src/loggers/ILogger.js";

export class OraLogger implements ILogger {
    constructor(
        private readonly spinner: Ora = ora(),
        private readonly scopes: string[] = []
    ) {}

    start(): void {
        this.spinner.start();
    }

    stop(): void {
        this.spinner.stop();
    }

    log(msg: string): void {
        this.spinner.text = this.format(msg);
        this.spinner.render();
    }

    error(msg: string): void {
        this.spinner.stopAndPersist({
            symbol: "❌ ",
            text: this.format(msg)
        });
    }

    scope(name: string): ILogger {
        return new OraLogger(this.spinner, [...this.scopes, name]);
    }

    private format(msg: string): string {
        if (this.scopes.length === 0) {
            return msg;
        }

        const prefix = this.scopes.map(s => `[${s}]`).join("");
        return `${prefix} ${msg}`;
    }
}
