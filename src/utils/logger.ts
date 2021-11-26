import * as ora from "ora";

import { ILogger } from "./ILogger";

export class OraLogger implements ILogger {
    private _logger: ora.Ora = ora();

    start(): void {
        this._logger.start();
    }

    stop(): void {
        this._logger.stop();
    }

    log(msg: string): void {
        this._logger.text = msg;
        this._logger.render();
    }

    error(msg: string): void {
        this._logger.stopAndPersist({
            symbol: "❌ ",
            text: msg
        });
    }
}

export function numPadding(i: number, total: number): string {
    const digits = total.toString().length;
    const iPadding = `${i + 1}`.padStart(digits);

    return `${iPadding}/${total}`;
}
