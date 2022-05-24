import * as t from "io-ts";

import { defaultDependencyType } from "../cli/common";
import { printDependencyTree } from "../extensions/utilities/LoopUtilities";
import { Package } from "../package/package";
import { FileSystemPackageProvider } from "../providers/folder";
import { getPackageVersionFromPath } from "../visitors/util.node";
import { getPackageVersionfromString, PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";
import { BaseFolderParameter, BasePackageParameter, TypeParameter } from "./Validation";

const PackageParams = t.intersection([BasePackageParameter, TypeParameter]);
const FolderParams = t.intersection([BaseFolderParameter, TypeParameter]);

const TreeReportParams = t.union([PackageParams, FolderParams]);

export type ITreeReportParams = t.TypeOf<typeof TreeReportParams>;

export class TreeReport extends AbstractReport<ITreeReportParams> {
    name = `Tree Report`;
    pkg: PackageVersion;

    constructor(params: ITreeReportParams) {
        super(params);

        this.type = params.type ?? defaultDependencyType;

        if (PackageParams.is(params)) {
            this.pkg = getPackageVersionfromString(params.package);
        } else {
            this.pkg = getPackageVersionFromPath(params.folder);
            this.provider = new FileSystemPackageProvider(params.folder);
        }
    }

    async report({ stdoutFormatter }: IReportContext, pkg: Package): Promise<void> {
        printDependencyTree(pkg, stdoutFormatter);
    }

    override validate(): t.Type<ITreeReportParams> {
        return TreeReportParams;
    }
}
