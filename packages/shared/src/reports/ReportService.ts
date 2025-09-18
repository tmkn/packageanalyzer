import chalk from "chalk";

import { type IPackage } from "../package/package.js";
import { Formatter, type IFormatter } from "../utils/formatter.js";
import { Visitor } from "../visitors/visitor.js";
import { type GenericReport, type IReportConfig, isReportConfigArray } from "./Report.js";
import type { IHost } from "../host/IHost.js";

export type ReportServiceConfig = {
    reports: GenericReport[];
};

export class ReportService {
    private readonly _stdoutFormatter: IFormatter;
    private readonly _stderrFormatter: IFormatter;

    constructor(
        private readonly _config: ReportServiceConfig,
        private readonly _host: IHost
    ) {
        this._stdoutFormatter = new Formatter(this._host.getStdoutWriter());
        this._stderrFormatter = new Formatter(this._host.getStderrWriter());
    }

    async process(): Promise<number | void> {
        let exitCode: number = 0;

        try {
            exitCode = await this._report(this._config);
        } catch (e: any) {
            this._stderrFormatter.writeLine(e?.toString());
            console.error(e?.toString());

            exitCode = 1;
        } finally {
            await Promise.all([
                this._host.getStdoutWriter().flush(),
                this._host.getStderrWriter().flush()
            ]);
        }

        return exitCode;
    }

    private async _report({ reports }: ReportServiceConfig): Promise<number> {
        for (const report of reports) {
            const packages: IPackage[] = await this._getPackages(report);

            if (reports.length > 1)
                this._stdoutFormatter.writeLine(chalk.underline.bgBlue(`Report: ${report.name}`));

            await report.report(packages, {
                stdoutFormatter: this._stdoutFormatter,
                stderrFormatter: this._stderrFormatter
            });
            this._stdoutFormatter.writeLine(``);
        }

        return Math.max(...reports.map(report => report.exitCode));
    }

    private async _getPackage(entry: IReportConfig, report: GenericReport): Promise<IPackage> {
        const visitor = new Visitor(
            entry.pkg,
            report.provider ?? this._host.getDefaultProvider(),
            this._host.getLogger(),
            entry.attachments ?? {},
            entry.depth
        );

        return visitor.visit(entry.type);
    }

    private async _getPackages(report: GenericReport): Promise<IPackage[]> {
        const entries: Array<IReportConfig> = isReportConfigArray(report.configs)
            ? report.configs
            : [report.configs];
        const packageArgs: IPackage[] = [];

        for (const entry of entries) {
            packageArgs.push(await this._getPackage(entry, report));
        }

        return packageArgs;
    }
}
