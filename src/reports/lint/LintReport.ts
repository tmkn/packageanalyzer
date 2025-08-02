import z from "zod";

import type { IPackage } from "../../package/package.js";
import type { IPackageJsonProvider } from "../../providers/provider.js";
import { AbstractReport, type IReportConfig, type IReportContext } from "../Report.js";
import type { IRulesLoader } from "./RulesLoader.js";

const SharedParameters = z.object({
    lintFile: z.string(),
    depth: z.number().default(Infinity)
});

const PackageParameters = SharedParameters.extend({
    package: z.string()
});

const FolderParameters = SharedParameters.extend({
    folder: z.string()
});

const LintParams = z.union([PackageParameters, FolderParameters]);

export type ILintParams = z.infer<typeof LintParams>;

export class DiffReport extends AbstractReport<ILintParams, IReportConfig[]> {
    name = "Lint Report";
    configs: IReportConfig[];

    constructor(params: ILintParams) {
        super(params);

        if (this._isPackageParams(params)) {
            params;
        } else {
            params;
        }

        this.configs = [];
    }

    async report(packages: IPackage[], ctx: IReportContext): Promise<void> {}

    override validate(): z.ZodTypeAny {
        return LintParams;
    }

    private _isPackageParams(data: unknown): data is z.infer<typeof PackageParameters> {
        return PackageParameters.safeParse(data).success;
    }
}
