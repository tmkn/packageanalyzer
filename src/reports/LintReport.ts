import * as path from "path";
import { z } from "zod";

import { IPackage } from "../package/package";
import { AbstractReport, IReportContext } from "./Report";
import { PathUtilities } from "../extensions/utilities/PathUtilities";
import { ILintCheck, ZodLintRule } from "./lint/LintRule";
import { ILintResult, LintResultFormatter } from "./lint/LintResultFormatter";
import { PackageVersion, getPackageVersionfromString } from "../visitors/visitor";
import { getPackageVersionFromPath } from "../visitors/util.node";
import { FileSystemPackageProvider } from "../providers/folder";

const LintFile = z.object({
    rules: z.array(ZodLintRule)
});

export type ILintFile = z.infer<typeof LintFile>;

const BaseLintParams = z.object({
    lintFile: z.string(),
    depth: z.number()
});

const FolderLintParams = BaseLintParams.merge(z.object({ folder: z.string() }));
const PackageLintParams = BaseLintParams.merge(z.object({ package: z.string() }));

export const LintReportParams = z.union([FolderLintParams, PackageLintParams]);

export type ILintParams = z.infer<typeof LintReportParams>;

export class LintReport extends AbstractReport<ILintParams> {
    name = `Lint Report`;
    pkg: PackageVersion;
    override depth: number | undefined;

    constructor(params: ILintParams) {
        super(params);
        this.depth = params.depth;

        if (this._isPackageLintParams(params)) {
            this.pkg = getPackageVersionfromString(params.package);
        } else {
            this.pkg = getPackageVersionFromPath(params.folder);
            this.provider = new FileSystemPackageProvider(params.folder);
        }
    }

    private async _loadLintFile(lintFile: string): Promise<ILintFile> {
        const importPath: string = path.isAbsolute(lintFile)
            ? lintFile
            : path.join(process.cwd(), lintFile);

        const importedLintFile = await import(importPath);

        if (this._isLintFile(importedLintFile)) {
            return importedLintFile;
        } else {
            this.exitCode = 1;

            throw new Error(`Invalid lint file format: ${this.params.lintFile}`);
        }
    }

    private _isPackageLintParams(data: unknown): data is z.infer<typeof PackageLintParams> {
        return PackageLintParams.safeParse(data).success;
    }

    private _isLintFile(data: unknown): data is z.infer<typeof LintFile> {
        return LintFile.safeParse(data).success;
    }

    async report(context: IReportContext, pkg: IPackage): Promise<void> {
        const rules: ILintFile = await this._loadLintFile(this.params.lintFile);

        const resultFormatter = new LintResultFormatter(context.stdoutFormatter);
        const lintResults: ILintResult[] = [];

        context.stdoutFormatter.writeLine(`PackageLint: ${pkg.fullName}`);

        pkg.visit(dep => {
            for (const [type, rule, params] of rules.rules) {
                let checkResult;

                try {
                    const checkParams = rule.checkParams?.() ?? z.any();
                    const checkParamsResult = checkParams.safeParse(params);

                    if (!checkParamsResult.success) {
                        throw new Error(`invalid params "${JSON.stringify(params)}"`);
                    }

                    checkResult = rule.check(dep, checkParamsResult.data);

                    if (this._isvalidResultFormat(checkResult)) {
                        if (type === `error`) {
                            this.exitCode = 1;
                        }

                        for (const message of this.#toMessageArray(checkResult)) {
                            lintResults.push({
                                type,
                                name: rule.name,
                                message,
                                path: new PathUtilities(dep).path,
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

    #toMessageArray(result: string | string[]): string[] {
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

    private _isvalidResultFormat(result: unknown): result is string | string[] {
        return (
            typeof result === `string` ||
            (Array.isArray(result) && result.every(r => typeof r === `string`))
        );
    }

    override validate(): z.ZodTypeAny {
        return LintReportParams;
    }
}
