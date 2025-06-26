import { Writable } from "stream";
import { z, type ZodTypeAny } from "zod";

import {
    AbstractReport,
    type EntryTypes,
    type GenericReport,
    type IReportContext
} from "../Report.js";
import { type ICombinedReportConfig, ReportService } from "../ReportService.js";
import { type IRulesLoader } from "./RulesLoader.js";
import { type IAttachment } from "../../attachments/Attachments.js";
import { type IPackage } from "../../package/package.js";
import type { ILintCheck, IPackageJsonProvider, PackageVersion } from "../../index.js";
import { type ILintResult, LintResultFormatter } from "./LintResultFormatter.js";
import { PathUtilities } from "../../extensions/utilities/PathUtilities.js";
import { hasAttachments } from "./LintRule.js";
import { Formatter, type IFormatter } from "../../utils/formatter.js";

// dummy lint report to just fetch all data
class LintReport extends AbstractReport<{}, EntryTypes, ZodTypeAny, IAttachment<string, any>[]> {
    override name: string;
    override pkg: PackageVersion;

    constructor(name: string, pkg: PackageVersion) {
        super({});
        this.name = name;
        this.pkg = pkg;
    }

    override report(context: IReportContext, ..._pkg: IPackage[]): Promise<number | void> {
        throw new Error("Method should not be called");
    }
}

export interface ILintServiceConfig {
    entry: PackageVersion;
    loader: IRulesLoader;
    depth: number;
    provider: IPackageJsonProvider;
}

export class LintService {
    constructor(
        private readonly _config: ILintServiceConfig,
        private readonly _stdout: Writable,
        private readonly _stderr: Writable
    ) {}

    private exitCode: number = 0;

    async process(): Promise<number | void> {
        try {
            const lintReport = await this._createReport();
            const reportService = new ReportService(lintReport, this._stdout, this._stderr);

            this.exitCode = (await reportService.process()) ?? 0;
        } catch (e: any) {
            const stderrFormatter: IFormatter = new Formatter(this._stderr);

            stderrFormatter.writeLine(e?.toString());
            console.error(e?.toString());

            this.exitCode = 1;
        }

        return this.exitCode;
    }

    private async _createReport(): Promise<ICombinedReportConfig> {
        const { entry, depth, provider, loader } = this._config;
        const { rules } = await loader.getRules();
        const reports: GenericReport[] = [];

        for (const [_type, check] of rules) {
            const report = new LintReport(check.name, entry);

            if (hasAttachments(check)) {
                report.attachments = check.attachments;
            }
            report.depth = depth;
            report.provider ??= provider;

            reports.push(report);
        }

        if (reports.length === 0) {
            // todo should throw instead?
            // throw new Error("No rules found!");
            const report = new LintReport("check.name", entry);

            report.provider ??= provider;

            reports.push(report);
        }

        return {
            mode: "combined",
            reports,
            report: async (context, ...packages) => {
                const resultFormatter = new LintResultFormatter(context.stdoutFormatter);
                const lintResults: ILintResult[] = [];
                const lookup: Map<IPackage, IPackage[]> = this._createPackageLookup(
                    packages.filter(pkg => pkg !== undefined)
                );

                context.stdoutFormatter.writeLine(`PackageLint: ${packages[0]?.fullName}`);

                const pkg = packages[0]!;
                pkg.visit(dep => {
                    for (const [i, [type, rule, params]] of rules.entries()) {
                        let checkResult;

                        try {
                            const checkParams = rule.checkParams?.() ?? z.any();
                            const checkParamsResult = checkParams.safeParse(params);

                            if (!checkParamsResult.success) {
                                throw new Error(`invalid params "${JSON.stringify(params)}"`);
                            }

                            const attachmentSpecificPkg = lookup.get(dep)![i]!;
                            checkResult = rule.check(attachmentSpecificPkg, checkParamsResult.data);

                            if (this._isValidResultFormat(checkResult)) {
                                if (type === `error`) {
                                    this.exitCode = 1;
                                }

                                for (const message of this._toMessageArray(checkResult)) {
                                    lintResults.push({
                                        type,
                                        name: rule.name,
                                        message,
                                        path: new PathUtilities(attachmentSpecificPkg).path,
                                        pkg: dep
                                    });
                                }
                            } else if (checkResult !== undefined) {
                                throw new Error(
                                    `Invalid check implementation! check() must return "string" or "string[]". Returned "${typeof checkResult}"`
                                );
                            }
                        } catch (e) {
                            this._reportError(e, lintResults, rule, dep);
                        }
                    }
                }, true);
                // }

                resultFormatter.format(lintResults);

                return this.exitCode;
            }
        };
    }

    // WARNING: Complex implementation ahead!
    //
    // With the new attachment support in the lint command, we now have multiple packages.
    // Each package represents the same dependency tree but with different attachments.
    // We only need to traverse the dependency tree once, but for each step,
    // we must use the correct package for the rule based on its defined attachments.
    // This function creates a lookup map to match each dependency (traversed once)
    // with the appropriate package aka attachments for the rule.
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⣀⣀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣤⣾⡷⠶⠛⠋⠉⠉⠉⠉⠉⠛⠿⣶⣶⣶⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣶⠟⠛⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠛⠦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣴⠾⠟⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠳⣤⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⡾⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣾⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠿⣷⣀⠀⠀⠀⠀⠀⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⣆⠀⠀⠀⠀⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢻⣷⡀⠀⠀⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣷⠂⠀⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣧⠀⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⡀⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⡇⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⢺⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡇
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⡀⠀⠀⠀⠀⠀⢰⡿⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣿⣿⣿⣿⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣿⣿⣿⡇⠀⠀⠀⢠⣿⠃⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣿⣿⣿⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⠇⠀⠀⣠⣿⠋⠀⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠁⠀⢀⣾⡟⠁⠀⠀⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣴⡿⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣾⠋⠀⠀⠀⠀⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣾⡿⠋⠀⠘⠻⣷⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⠿⠁⠀⠀⠀⠀⠀⠀
    // ⠀⠀⠀⠀⠀⠀⠀⢀⣼⡿⠋⠀⠀⠀⠀⠸⣧⡛⢿⣦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣴⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀
    // ⠀⠀⠀⠀⠀⠀⢀⣾⠏⠀⠀⠀⠀⠀⠀⠀⠙⣿⡤⠈⠻⠿⣷⣄⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣤⣦⣴⣴⡆⢀⣠⣶⠿⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⠀⠀⠀⠀⠀⠀⣿⢃⡄⠀⠀⠀⠀⠀⠀⠀⠀⢹⣷⡀⠀⠀⠈⠙⠻⠿⢶⣤⣤⣀⡀⠀⠀⠀⠀⠀⠀⠀⠙⣉⣀⣤⣤⠿⠛⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⠀⠀⠀⠀⢀⣾⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⡇⠀⠀⠀⠀⠀⠀⠀⠈⠉⠛⠻⠿⠿⠶⠶⠶⠾⢿⣿⡛⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⠀⠀⠀⢠⣾⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⡇⠀⠀⢀⣤⣤⣴⣶⣤⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⣻⠗⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⠀⠀⠀⣾⠋⠀⠀⠀⠀⠀⢰⣷⠀⠀⠀⠀⠀⠀⠸⣿⣴⠾⠟⠉⠀⠀⠀⠉⠛⠿⣶⣀⠀⢀⣤⣶⠾⠿⠛⠶⠿⣶⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⠀⠀⢰⡇⠀⠀⠀⠀⠀⠀⠘⣿⠀⠀⠀⠀⠀⠀⠀⠸⣷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠻⣷⣾⠟⠉⠀⠀⠀⠀⠀⠀⠙⢿⣆⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⠀⢠⡿⠀⠀⠀⠀⠀⠀⠀⠀⢿⣧⠀⠀⠀⠀⠀⠀⠀⢹⣷⡀⠀⠀⠀⠀⢀⣠⣤⣤⣿⣇⠀⠀⠀⠀⣠⣤⣤⣤⣀⣀⣿⡟⢶⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⠀⣾⠃⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣷⡄⠀⠀⠀⠀⠀⠀⠹⢷⣦⣀⣀⣴⠟⠋⢩⣉⠻⣿⡆⠀⢀⣾⣛⣹⡍⠉⠛⠿⠟⠀⢸⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⢰⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⣦⡀⠀⠀⠀⠀⠀⠀⠉⠉⠉⠁⠀⠀⠙⠛⠛⠻⣷⡀⣿⡟⠙⠛⠁⠀⠀⠀⠀⠀⣼⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣼⡟⢿⣶⣄⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⡇⣿⠀⠀⠀⠀⠀⠀⠀⣠⣾⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⡏⡀⠀⠉⠙⠛⠿⣶⣦⣤⣤⣤⣄⡀⠀⠀⠀⠀⣰⡿⠀⠹⣧⣀⠀⢀⣠⣴⡾⠟⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣿⢿⠀⠀⠀⠀⠀⠀⠀⢠⣤⠀⠈⠙⠿⠿⠿⣿⣿⢿⡇⠀⠀⠈⠻⠿⠛⠋⠁⠀⢰⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠀⠈⠀⠀⠀⠀⠀⠀⠀⣼⡟⠈⠁⠀⠀⠀⠀⠀⠀⢸⡗⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⣿⡾⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⢸⡇⠀⠀⠀⠀⠀⠀⠀⠀⢸⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⠸⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡇⠀⠀⠀⠀⠀⠀⠀⠀⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⠀⠙⢿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣼⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⡇⠀⠀⠀⠀⠀⠀⠀⠀⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⠀⠀⠈⠹⢦⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣾⠟⠉⣿⡀⠀⠀⠀⠀⠀⠀⠀⢸⡿⣿⡀⠀⠀⠀⠀⠀⠀⠀⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⠀⠀⠀⠀⠀⠈⠙⠲⢦⣤⣄⣀⣀⣠⣤⣴⠿⠛⠋⠁⠀⠈⢻⣧⠀⠀⠀⠀⠀⠀⠀⢸⡇⠸⣷⣀⠀⠀⠀⠀⣀⣼⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠈⢿⣧⣀⣀⠀⣀⣀⣶⠏⠀⠀⠈⠻⠷⠶⣶⡾⠿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    // ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠛⠛⠛⠛⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀

    private _createPackageLookup(packages: IPackage[]): Map<IPackage, IPackage[]> {
        const toArray = (pkg: IPackage): IPackage[] => {
            const result: IPackage[] = [];

            pkg.visit(dep => result.push(dep), true);

            return result;
        };
        const packagesArray = packages.map(toArray);
        const rootPackageArray = packagesArray[0]!;
        const lookup = new Map<IPackage, IPackage[]>();

        for (const [i, key] of rootPackageArray.entries()) {
            const values = packagesArray.map(p => p[i]!);

            lookup.set(key, values);
        }

        return lookup;
    }

    private _toMessageArray(result: string | string[]): string[] {
        return Array.isArray(result) ? result : [result];
    }

    private _reportError(
        e: unknown,
        lintResults: ILintResult[],
        rule: ILintCheck,
        dep: IPackage
    ): void {
        this.exitCode = 1;

        if (e instanceof Error)
            lintResults.push({
                type: `internal-error`,
                name: rule.name,
                message: e.message,
                path: new PathUtilities(dep).path,
                pkg: dep
            });
    }

    private _isValidResultFormat(result: unknown): result is string | string[] {
        return (
            typeof result === `string` ||
            (Array.isArray(result) && result.every(r => typeof r === `string`))
        );
    }
}
