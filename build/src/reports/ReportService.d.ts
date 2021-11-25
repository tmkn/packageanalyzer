/// <reference types="node" />
import { Writable } from "stream";
import { IReport } from "./Report";
export interface IReports {
    reports: IReport<any>[];
}
export declare class ReportService {
    private _config;
    private _stdout;
    private _stderr;
    constructor(_config: IReports, _stdout: Writable, _stderr: Writable);
    process(): Promise<void>;
}
//# sourceMappingURL=ReportService.d.ts.map