import { Writable } from "stream";
import chalk from "chalk";

import { type IPackage } from "../package/package.js";
import { npmOnline } from "../providers/online.js";
import { Formatter, type IFormatter } from "../utils/formatter.js";
import { OraLogger } from "../loggers/OraLogger.js";
import { type PackageVersion, Visitor } from "../visitors/visitor.js";
import { type GenericReport, isPackageVersionArray, type ReportMethodSignature } from "./Report.js";

// each report is executed individually
interface IDistinctReportConfig {
    mode: "distinct";
    reports: GenericReport[];
}

// each entry in reports gets resolved and the resulting dependency trees
// are delivered to the report method for further processing
export interface ICombinedReportConfig {
    mode: "combined";
    reports: GenericReport[];
    report: ReportMethodSignature<PackageVersion[]>;
}

export type ReportConfig = IDistinctReportConfig | ICombinedReportConfig;

export class ReportService {
    constructor(
        private readonly _config: ReportConfig,
        private readonly _stdout: Writable,
        private readonly _stderr: Writable
    ) {}

    async process(): Promise<number | void> {
        const { mode } = this._config;
        let exitCode: number = 0;

        try {
            if (mode === "distinct") {
                exitCode = await this._reportAsDistinct(this._config);
            } else {
                exitCode = await this._reportAsCombined(this._config);
            }
        } catch (e: any) {
            const stderrFormatter: IFormatter = new Formatter(this._stderr);

            stderrFormatter.writeLine(e?.toString());
            console.error(e?.toString());

            exitCode = 1;
        }

        return exitCode;
    }

    private async _reportAsDistinct({ reports }: IDistinctReportConfig): Promise<number> {
        for (const report of reports) {
            const packages: IPackage[] = await this._getPackages(report);

            const stdoutFormatter: IFormatter = new Formatter(this._stdout);
            const stderrFormatter: IFormatter = new Formatter(this._stderr);

            if (reports.length > 1)
                stdoutFormatter.writeLine(chalk.underline.bgBlue(`Report: ${report.name}`));

            await report.report({ stdoutFormatter, stderrFormatter }, ...packages);
            stdoutFormatter.writeLine(``);
        }

        return Math.max(...reports.map(report => report.exitCode));
    }

    private async _reportAsCombined({ reports, report }: ICombinedReportConfig): Promise<number> {
        const packages: IPackage[] = [];

        for (const report of reports) {
            packages.push(...(await this._getPackages(report)));
        }

        const stdoutFormatter: IFormatter = new Formatter(this._stdout);
        const stderrFormatter: IFormatter = new Formatter(this._stderr);

        const exitCode = await report({ stdoutFormatter, stderrFormatter }, ...packages);
        stdoutFormatter.writeLine(``);

        return exitCode ?? 0;
    }

    private async _getPackage(entry: PackageVersion, report: GenericReport): Promise<IPackage> {
        const visitor = new Visitor(
            entry,
            report.provider ?? npmOnline,
            new OraLogger(),
            report.attachments ?? [],
            report.depth
        );

        return visitor.visit(report.type);
    }

    private async _getPackages(report: GenericReport): Promise<IPackage[]> {
        this._usesNetworkInTests(report);

        const entries: Array<PackageVersion> = isPackageVersionArray(report.pkg)
            ? report.pkg
            : [report.pkg];
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
