import ora, { type Ora } from "ora";

import { type ILogger } from "./ILogger.js";

export class OraLogger implements ILogger {
    private _logger: Ora = ora();

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
