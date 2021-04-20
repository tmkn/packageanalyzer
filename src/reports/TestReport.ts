import { Package } from "../package/package";
import { IFormatter } from "../utils/formatter";
import { getPackageVersionfromString, PackageVersion } from "../visitors/visitor";
import { IReport } from "./reports";

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
