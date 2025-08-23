import z from "zod";

import type { IPackage } from "../../package/package.js";
import { AbstractReport, type IReportConfig, type IReportContext } from "../Report.js";
import { hasAttachments, LintFile, type ILintCheck } from "./LintRule.js";
import { PackageVersionSchema } from "../../visitors/visitor.js";
import { LintResultFormatter, type ILintResult } from "./LintResultFormatter.js";
import { PathUtilities } from "../../extensions/utilities/PathUtilities.js";

const LintParams = z.object({
    lintFile: LintFile,
    depth: z.number().or(z.literal(Number.POSITIVE_INFINITY)),
    entry: PackageVersionSchema
});

export type ILintParams = z.infer<typeof LintParams>;

export class LintReport extends AbstractReport<ILintParams, IReportConfig[]> {
    name = "Lint Report";
    configs: IReportConfig[];

    constructor(params: ILintParams) {
        super(params);

        const configs: IReportConfig[] = [];
        for (const [_type, check] of params.lintFile.rules) {
            const config: IReportConfig = {
                pkg: params.entry,
                attachments: hasAttachments(check) ? check.attachments : undefined,
                depth: params.depth
            };

            configs.push(config);
        }

        // Add a dummy config if no rules are provided to ensure the summary is shown
        // Only really requires the 'pkg' property to display the package name.
        if (params.lintFile.rules.length === 0) {
            configs.push({
                pkg: params.entry,
                depth: 0
            });
        }

        this.configs = configs;
    }

    async report(packages: IPackage[], context: IReportContext): Promise<void> {
        const resultFormatter = new LintResultFormatter(context.stdoutFormatter);
        const lintResults: ILintResult[] = [];
        const lookup: Map<IPackage, IPackage[]> = this._createPackageLookup(
            packages.filter(pkg => pkg !== undefined)
        );

        context.stdoutFormatter.writeLine(`PackageLint: ${packages[0]?.fullName}`);

        const pkg = packages[0]!;
        pkg.visit(dep => {
            for (const [i, [type, rule, params]] of this.params.lintFile.rules.entries()) {
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

        resultFormatter.format(lintResults);
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

    override validate(): z.ZodType<ILintParams> {
        return LintParams;
    }
}
