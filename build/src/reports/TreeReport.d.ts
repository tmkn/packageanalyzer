import { Package } from "../package/package";
import { DependencyTypes, PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";
export interface ITreeReportParams {
    package?: string;
    folder?: string;
    type?: DependencyTypes;
}
export declare class TreeReport extends AbstractReport<ITreeReportParams> {
    readonly params: ITreeReportParams;
    name: string;
    pkg: PackageVersion;
    constructor(params: ITreeReportParams);
    report(pkg: Package, { stdoutFormatter }: IReportContext): Promise<void>;
}
//# sourceMappingURL=TreeReport.d.ts.map