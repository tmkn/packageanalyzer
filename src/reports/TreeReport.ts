import { defaultDependencyType } from "../cli/common";
import { printDependencyTree } from "../extensions/utilities/LoopUtilities";
import { Package } from "../package/package";
import { FileSystemPackageProvider } from "../providers/folder";
import { npmOnline } from "../providers/online";
import {
    DependencyTypes,
    getPackageVersionFromPackageJson,
    getPackageVersionfromString,
    PackageVersion
} from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";

export interface ITreeReportParams {
    package?: string;
    folder?: string;
    type?: DependencyTypes;
}

export class TreeReport extends AbstractReport<ITreeReportParams> {
    name = `Tree Report`;
    pkg: PackageVersion;

    constructor(readonly params: ITreeReportParams) {
        super();

        this.type = params.type ?? defaultDependencyType;

        if (params.package) {
            this.pkg = getPackageVersionfromString(params.package);
            this.provider = npmOnline;
        } else if (params.folder) {
            this.pkg = getPackageVersionFromPackageJson(params.folder);
            this.provider = new FileSystemPackageProvider(params.folder);
        } else {
            throw new Error(`Needs at least "package" or "folder" option`);
        }
    }

    async report(pkg: Package, { stdoutFormatter }: IReportContext): Promise<void> {
        printDependencyTree(pkg, stdoutFormatter);
    }
}
