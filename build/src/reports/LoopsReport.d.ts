import { Package } from "../package/package";
import { DependencyTypes, PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";
export interface ILoopParams {
    package: string;
    type: DependencyTypes;
}
export declare class LoopsReport extends AbstractReport<ILoopParams> {
    readonly params: ILoopParams;
    name: string;
    pkg: PackageVersion;
    constructor(params: ILoopParams);
    report(pkg: Package, { stdoutFormatter }: IReportContext): Promise<void>;
}
//# sourceMappingURL=LoopsReport.d.ts.map