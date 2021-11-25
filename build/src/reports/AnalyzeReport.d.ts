import { Package } from "../package/package";
import { IFormatter } from "../utils/formatter";
import { DependencyTypes, PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";
export interface IAnalyzeParams {
    package?: string;
    folder?: string;
    type?: DependencyTypes;
    full: boolean;
}
export declare class AnalyzeReport extends AbstractReport<IAnalyzeParams> {
    readonly params: IAnalyzeParams;
    name: string;
    pkg: PackageVersion;
    constructor(params: IAnalyzeParams);
    report(pkg: Package, { stdoutFormatter }: IReportContext): Promise<void>;
}
export declare function printStatistics(p: Package, all: boolean, formatter: IFormatter): Promise<void>;
//# sourceMappingURL=AnalyzeReport.d.ts.map