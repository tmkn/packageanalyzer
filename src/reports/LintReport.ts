import * as path from "path";
import { z } from "zod";

import { Package } from "../package/package";
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

    rules: ILintFile;

    constructor(params: ILintParams) {
        super(params);
        this.depth = params.depth;

        if (this._isPackageLintParams(params)) {
            this.pkg = getPackageVersionfromString(params.package);
        } else {
            this.pkg = getPackageVersionFromPath(params.folder);
            this.provider = new FileSystemPackageProvider(params.folder);
        }

        const lintFile = this._loadLintFile(params.lintFile);

        if (this._isLintFile(lintFile)) {
            this.rules = lintFile;
        } else {
            throw new Error(`Invalid lint file format: ${params.lintFile}`);
        }
    }

    private _loadLintFile(lintFile: string): unknown {
        let lintFileData: unknown;

        const importPath: string = path.isAbsolute(lintFile)
            ? lintFile
            : path.join(process.cwd(), lintFile);

        const data = require(importPath);
        lintFileData = data;

        return lintFileData;
    }

    private _isPackageLintParams(data: unknown): data is z.infer<typeof PackageLintParams> {
        return PackageLintParams.safeParse(data).success;
    }

    private _isLintFile(data: unknown): data is z.infer<typeof LintFile> {
        return LintFile.safeParse(data).success;
    }

    async report(context: IReportContext, pkg: Package): Promise<void> {
        const resultFormatter = new LintResultFormatter(context.stdoutFormatter);
        const lintResults: ILintResult[] = [];

        context.stdoutFormatter.writeLine(`PackageLint: ${pkg.fullName}`);

        pkg.visit(dep => {
            for (const [type, rule, params] of this.rules.rules) {
                let checkResult;

                try {
                    checkResult = rule.check(dep, params) as unknown;

                    if (this._isvalidResultFormat(checkResult)) {
                        if (type === `error`) {
                            this.exitCode = 1;
                        }

                        const messages = Array.isArray(checkResult) ? checkResult : [checkResult];

                        for (const message of messages) {
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

    private _reportError(
        e: unknown,
        lintResults: ILintResult[],
        rule: ILintCheck,
        dep: Package
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
