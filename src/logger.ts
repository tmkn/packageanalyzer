import * as ora from "ora";

export interface ILogger {
    start: () => void;
    stop: () => void;
    log: (msg: string) => void;
    error: (msg: string) => void;
}

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
    }

    error(msg: string): void {
        this._logger.stopAndPersist({
            symbol: "❌ ",
            text: msg
        });
    }
}
