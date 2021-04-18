import { IDecorator } from "../extensions/decorators/Decorator";
import { Package } from "../package/package";
import { IPackageVersionProvider } from "../providers/folder";
import { IFormatter } from "../utils/formatter";
import { PackageVersion } from "../visitors/visitor";

export interface IReport<T extends {}> {
    readonly name: string;
    readonly params: T;
    readonly pkg: PackageVersion;

    decorators?: IDecorator<any>[];
    provider?: IPackageVersionProvider;

    report(pkg: Package, formatter: IFormatter): Promise<void>;
}

interface ITestReportParams {}
export class TestReport implements IReport<ITestReportParams> {
    name = `Test Report`;
    pkg: PackageVersion = [``, ``];

    constructor(readonly params: ITestReportParams) {}

    async report(pkg: Package, formatter: IFormatter): Promise<void> {}
}

export class ReportService {
    async process(reports: IReport<any>[]): Promise<void> {
        try {
            for (const report of reports) {
            }
        } catch (e) {}
    }
}
