import type { ILogger } from "./ILogger.js";

export interface ILogController extends ILogger {
    scope(scope: string): ILogger;
}
