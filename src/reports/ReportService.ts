import { Writable } from "stream";
import * as chalk from "chalk";

import { Package } from "../package/package";
import { npmOnline } from "../providers/online";
import { Formatter, IFormatter } from "../utils/formatter";
import { OraLogger } from "../utils/logger";
import { Visitor } from "../visitors/visitor";
import { IReports } from "./reports";

export class ReportService {
    constructor(private _config: IReports, private _stdout: Writable) {
        //todo validate _config
    }

    async process(): Promise<void> {
        const { reports } = this._config;

        try {
            for (const report of reports) {
                const formatter: IFormatter = new Formatter(this._stdout);
                const visitor = new Visitor(
                    report.pkg,
                    report.provider ?? npmOnline,
                    new OraLogger(),
                    report.decorators
                );

                formatter.writeLine(chalk.underline.bgBlue(`Report: ${report.name}`));

                const p: Package = await visitor.visit();

                report.report(p, formatter);
                formatter.writeLine(``);
            }
        } catch (e) {}
    }
}
