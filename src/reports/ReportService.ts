import { Writable } from "stream";
import chalk from "chalk";

import { type IPackage } from "../package/package.js";
import { npmOnline } from "../providers/online.js";
import { Formatter, type IFormatter } from "../utils/formatter.js";
import { OraLogger } from "../loggers/OraLogger.js";
import { Visitor } from "../visitors/visitor.js";
import { type GenericReport, type IReportConfig, isReportConfigArray } from "./Report.js";

export type ReportServiceConfig = {
    reports: GenericReport[];
};

export class ReportService {
    constructor(
        private readonly _config: ReportServiceConfig,
        private readonly _stdout: Writable,
        private readonly _stderr: Writable
    ) {}

    async process(): Promise<number | void> {
        let exitCode: number = 0;

        try {
            exitCode = await this._report(this._config);
        } catch (e: any) {
            const stderrFormatter: IFormatter = new Formatter(this._stderr);

            stderrFormatter.writeLine(e?.toString());
            console.error(e?.toString());

            exitCode = 1;
        }

        return exitCode;
    }

    private async _report({ reports }: ReportServiceConfig): Promise<number> {
        for (const report of reports) {
            const packages: IPackage[] = await this._getPackages(report);

            const stdoutFormatter: IFormatter = new Formatter(this._stdout);
            const stderrFormatter: IFormatter = new Formatter(this._stderr);

            if (reports.length > 1)
                stdoutFormatter.writeLine(chalk.underline.bgBlue(`Report: ${report.name}`));

            await report.report(packages, { stdoutFormatter, stderrFormatter });
            stdoutFormatter.writeLine(``);
        }

        return Math.max(...reports.map(report => report.exitCode));
    }

    private async _getPackage(entry: IReportConfig, report: GenericReport): Promise<IPackage> {
        const visitor = new Visitor(
            entry.pkg,
            report.provider ?? npmOnline,
            new OraLogger(),
            entry.attachments ?? {},
            entry.depth
        );

        return visitor.visit(entry.type);
    }

    private async _getPackages(report: GenericReport): Promise<IPackage[]> {
        this._usesNetworkInTests(report);

        const entries: Array<IReportConfig> = isReportConfigArray(report.configs)
            ? report.configs
            : [report.configs];
        const packageArgs: IPackage[] = [];

        for (const entry of entries) {
            packageArgs.push(await this._getPackage(entry, report));
        }

        return packageArgs;
    }

    /* istanbul ignore next */
    private _usesNetworkInTests({ name, provider }: GenericReport): void {
        if (process.env.NODE_ENV === "test") {
            if (typeof provider === "undefined")
                throw new Error(`${name}: Unit Test will default to online package provider`);

            if (provider === npmOnline) {
                throw new Error(`${name}: Unit Test are using the online package provider`);
            }
        }
    }
}
