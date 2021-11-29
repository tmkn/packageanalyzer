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
