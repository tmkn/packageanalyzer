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

interface ITestReportParams {
    package: string;
}
export class TestReport implements IReport<ITestReportParams> {
    name = `Test Report`;
    pkg: PackageVersion;

    constructor(readonly params: ITestReportParams) {
        this.pkg = getPackageVersionfromString(params.package);
    }

    async report(pkg: Package, formatter: IFormatter): Promise<void> {
        formatter.writeLine(`Hello World TestReport:`);
        formatter.writeLine(`${pkg.fullName}`);
    }
}
