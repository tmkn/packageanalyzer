import { Package } from "../package/package";
import { OnlinePackageProvider } from "../providers/online";
import { PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";
export interface IUpdateInfoParams {
    package: string;
    provider: OnlinePackageProvider;
}
export declare class UpdateInfoReport extends AbstractReport<IUpdateInfoParams> {
    readonly params: IUpdateInfoParams;
    name: string;
    pkg: PackageVersion;
    constructor(params: IUpdateInfoParams);
    report(pkg: Package, { stdoutFormatter }: IReportContext): Promise<void>;
}
//# sourceMappingURL=UpdateInfoReport.d.ts.map