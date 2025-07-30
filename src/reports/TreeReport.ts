import { z } from "zod";

import { defaultDependencyType } from "../cli/common.js";
import { printDependencyTree } from "../extensions/utilities/LoopUtilities.js";
import { type IPackage } from "../package/package.js";
import { FileSystemPackageProvider } from "../providers/folder.js";
import { getPackageVersionFromPath } from "../visitors/util.node.js";
import { getPackageVersionfromString, type PackageVersion } from "../visitors/visitor.js";
import { AbstractReport, type IReportContext } from "./Report.js";
import { BaseFolderParameter, BasePackageParameter, TypeParameter } from "./Validation.js";

const PackageParams = BasePackageParameter.merge(TypeParameter);
const FolderParams = BaseFolderParameter.merge(TypeParameter);

const TreeReportParams = z.union([PackageParams, FolderParams]);

export type ITreeReportParams = z.infer<typeof TreeReportParams>;

export class TreeReport extends AbstractReport<ITreeReportParams> {
    name = `Tree Report`;
    pkg: PackageVersion;

    constructor(params: ITreeReportParams) {
        super(params);

        this.type = params.type ?? defaultDependencyType;

        if (this._isPackageParams(params)) {
            this.pkg = getPackageVersionfromString(params.package);
        } else {
            this.pkg = getPackageVersionFromPath(params.folder);
            this.provider = new FileSystemPackageProvider(params.folder);
        }
    }

    async reportLegacy([pkg]: [IPackage], { stdoutFormatter }: IReportContext): Promise<void> {
        printDependencyTree(pkg, stdoutFormatter);
    }

    private _isPackageParams(data: unknown): data is z.infer<typeof PackageParams> {
        return PackageParams.safeParse(data).success;
    }

    override validate(): z.ZodTypeAny {
        return TreeReportParams;
    }
}
