import { Package } from "../package/package";
import { DependencyTypes, PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";
export interface ILicenseParams {
    package?: string;
    folder?: string;
    type?: DependencyTypes;
    allowList?: string[];
    grouped?: boolean;
}
export declare class LicenseReport extends AbstractReport<ILicenseParams> {
    readonly params: ILicenseParams;
    name: string;
    readonly pkg: PackageVersion;
    allowList: string[];
    grouped: boolean;
    constructor(params: ILicenseParams);
    report(pkg: Package, { stdoutFormatter }: IReportContext): Promise<void>;
}
//# sourceMappingURL=LicenseReport.d.ts.map