import { Writable } from "stream";
import * as chalk from "chalk";

import { Package } from "../package/package";
import { npmOnline } from "../providers/online";
import { Formatter, IFormatter } from "../utils/formatter";
import { OraLogger } from "../utils/logger";
import { Visitor } from "../visitors/visitor";
import { IReport } from "./Report";

export interface IReports {
    reports: IReport<any>[];
}

export class ReportService {
    constructor(private _config: IReports, private _stdout: Writable, private _stderr: Writable) {
        //todo validate _config
    }

    async process(): Promise<void> {
        const { reports } = this._config;

        try {
            for (const report of reports) {
                const stdoutFormatter: IFormatter = new Formatter(this._stdout);
                const stderrFormatter: IFormatter = new Formatter(this._stderr);
                const visitor = new Visitor(
                    report.pkg,
                    report.provider ?? npmOnline,
                    new OraLogger(),
                    report.decorators,
                    report.depth
                );

                if (reports.length > 1)
                    stdoutFormatter.writeLine(chalk.underline.bgBlue(`Report: ${report.name}`));

                const p: Package = await visitor.visit(report.type);

                await report.report(p, { stdoutFormatter, stderrFormatter });
                stdoutFormatter.writeLine(``);
            }
        } catch (e: any) {
            const stderrFormatter: IFormatter = new Formatter(this._stderr);

            stderrFormatter.writeLine(e?.toString());
        }
    }
}
