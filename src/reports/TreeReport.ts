import { defaultDependencyType } from "../cli/common";
import { printDependencyTree } from "../extensions/metrics/LoopMetrics";
import { Package } from "../package/package";
import { FileSystemPackageProvider, IPackageVersionProvider } from "../providers/folder";
import { npmOnline } from "../providers/online";
import { IFormatter } from "../utils/formatter";
import {
    DependencyTypes,
    getPackageVersionFromPackageJson,
    getPackageVersionfromString,
    PackageVersion
} from "../visitors/visitor";
import { IReport } from "./Report";

export interface ITreeReportParams {
    package?: string;
    folder?: string;
    type?: DependencyTypes;
}

export class TreeReport implements IReport<ITreeReportParams> {
    name = `Tree Report`;
    pkg: PackageVersion;
    type: DependencyTypes;
    provider?: IPackageVersionProvider;

    constructor(readonly params: ITreeReportParams) {
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

    async report(pkg: Package, formatter: IFormatter): Promise<void> {
        printDependencyTree(pkg, formatter);
    }
}
