import { Package } from "../package/package";
export interface ILicenseCheckResult {
    ok: boolean;
    parseError: boolean;
}
interface ILicenseCheckReport {
    ok: boolean;
    allChecks: Map<Package, ILicenseCheckResult>;
    failedChecks: Map<Package, ILicenseCheckResult>;
    passedChecks: Map<Package, ILicenseCheckResult>;
}
export declare type LicenseCheckReport = Readonly<ILicenseCheckReport>;
export declare function createWhitelistLicenseCheckReport(pkg: Package, whitelist: string[], includeSelf: boolean): LicenseCheckReport;
export {};
//# sourceMappingURL=licenseCheckService.d.ts.map