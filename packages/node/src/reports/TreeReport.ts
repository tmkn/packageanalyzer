import { z } from "zod";

import { defaultDependencyType } from "../common.js";
import { printDependencyTree } from "../extensions/utilities/LoopUtilities.js";
import { type IPackage } from "../../../shared/src/package/package.js";
import { FileSystemPackageProvider } from "../providers/folder.js";
import { getPackageVersionFromPath } from "../visitors/util.node.js";
import { getPackageVersionfromString } from "../../../shared/src/visitors/visitor.js";
import {
    AbstractReport,
    type IReportConfig,
    type IReportContext
} from "../../../shared/src/reports/Report.js";
import {
    BaseFolderParameter,
    BasePackageParameter,
    TypeParameter
} from "../../../shared/src/reports/Validation.js";

const PackageParams = BasePackageParameter.merge(TypeParameter);
const FolderParams = BaseFolderParameter.merge(TypeParameter);

const TreeReportParams = z.union([PackageParams, FolderParams]);

export type ITreeReportParams = z.infer<typeof TreeReportParams>;

export class TreeReport extends AbstractReport<ITreeReportParams> {
    name = `Tree Report`;
    configs: IReportConfig;

    constructor(params: ITreeReportParams) {
        super(params);

        const type = params.type ?? defaultDependencyType;

        if (this._isPackageParams(params)) {
            this.configs = {
                pkg: getPackageVersionfromString(params.package),
                type
            };
        } else {
            this.configs = {
                pkg: getPackageVersionFromPath(params.folder),
                type
            };
            this.provider = new FileSystemPackageProvider(params.folder);
        }
    }

    async report([pkg]: [IPackage], { stdoutFormatter }: IReportContext): Promise<void> {
        printDependencyTree(pkg, stdoutFormatter);
    }

    private _isPackageParams(data: unknown): data is z.infer<typeof PackageParams> {
        return PackageParams.safeParse(data).success;
    }

    override validate(): z.ZodType<ITreeReportParams> {
        return TreeReportParams;
    }
}
