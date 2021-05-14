import { defaultDependencyType, printStatistics } from "../cli/common";
import { IDecorator } from "../extensions/decorators/Decorator";
import { ReleaseDecorator } from "../extensions/decorators/ReleaseDecorator";
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

export interface IAnalyzeParams {
    package?: string;
    folder?: string;
    type?: DependencyTypes;
    full: boolean;
}

export class AnalyzeReport implements IReport<IAnalyzeParams> {
    name = `Analyze Report`;
    pkg: PackageVersion;
    type: DependencyTypes;
    provider?: IPackageVersionProvider;
    decorators?: IDecorator<any>[] = [];

    constructor(readonly params: IAnalyzeParams) {
        if (params.package) {
            this.pkg = getPackageVersionfromString(params.package);
            this.provider = npmOnline;
            this.decorators = [new ReleaseDecorator(npmOnline)];
        } else if (params.folder) {
            this.pkg = getPackageVersionFromPackageJson(params.folder);
            this.provider = new FileSystemPackageProvider(params.folder);
        } else {
            throw new Error(`No package or folder option provided`);
        }

        this.type = params.type ?? defaultDependencyType;
    }

    async report(pkg: Package, formatter: IFormatter): Promise<void> {
        await printStatistics(pkg, this.params.full, formatter);
    }
}
