import { Writable } from "stream";
import * as chalk from "chalk";
import { z } from "zod";

import { Package } from "../package/package";
import { npmOnline } from "../providers/online";
import { Formatter, IFormatter } from "../utils/formatter";
import { OraLogger } from "../loggers/OraLogger";
import { PackageVersion, Visitor } from "../visitors/visitor";
import { EntryTypes, IReport, isPackageVersionArray } from "./Report";

export interface IReports {
    reports: IReport<EntryTypes, any, z.ZodTypeAny>[];
}

export class ReportService {
    constructor(private _config: IReports, private _stdout: Writable, private _stderr: Writable) {}

    async process(): Promise<void> {
        const { reports } = this._config;

        try {
            for (const report of reports) {
                this._usesNetworkInTests(report);

                const entries: Array<PackageVersion> = isPackageVersionArray(report.pkg)
                    ? report.pkg
                    : [report.pkg];
                const packageArgs: Package[] = [];

                for (const entry of entries) {
                    packageArgs.push(await this._getPackage(entry, report));
                }

                const stdoutFormatter: IFormatter = new Formatter(this._stdout);
                const stderrFormatter: IFormatter = new Formatter(this._stderr);

                if (reports.length > 1)
                    stdoutFormatter.writeLine(chalk.underline.bgBlue(`Report: ${report.name}`));

                await report.report({ stdoutFormatter, stderrFormatter }, ...packageArgs);
                stdoutFormatter.writeLine(``);
            }
        } catch (e: any) {
            const stderrFormatter: IFormatter = new Formatter(this._stderr);

            stderrFormatter.writeLine(e?.toString());
            console.error(e?.toString());
        }
    }

    private async _getPackage(
        entry: PackageVersion,
        report: IReport<EntryTypes, any, z.ZodTypeAny>
    ): Promise<Package> {
        const visitor = new Visitor(
            entry,
            report.provider ?? npmOnline,
            new OraLogger(),
            report.decorators,
            report.depth
        );

        return visitor.visit(report.type);
    }

    /* istanbul ignore next */
    private _usesNetworkInTests({ name, provider }: IReport<EntryTypes, any, z.ZodTypeAny>): void {
        if (process.env.NODE_ENV === "test") {
            if (typeof provider === "undefined")
                throw new Error(`${name}: Unit Test will default to online package provider`);

            if (provider === npmOnline) {
                throw new Error(`${name}: Unit Test are using the online package provider`);
            }
        }
    }
}
