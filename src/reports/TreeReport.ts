import { z } from "zod";

import { ZodTypeAny } from "zod";
import { defaultDependencyType } from "../cli/common";
import { printDependencyTree } from "../extensions/utilities/LoopUtilities";
import { Package } from "../package/package";
import { FileSystemPackageProvider } from "../providers/folder";
import { getPackageVersionFromPath } from "../visitors/util.node";
import { getPackageVersionfromString, PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";
import { BaseFolderParameter, BasePackageParameter, TypeParameter } from "./Validation";

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

    async report({ stdoutFormatter }: IReportContext, pkg: Package): Promise<void> {
        printDependencyTree(pkg, stdoutFormatter);
    }

    private _isPackageParams(data: unknown): data is z.infer<typeof PackageParams> {
        return PackageParams.safeParse(data).success;
    }

    override validate(): ZodTypeAny {
        return TreeReportParams;
    }
}
