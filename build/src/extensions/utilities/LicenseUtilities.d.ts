import { Package } from "../../package/package";
declare type Name = string;
declare type Version = string;
declare type License = string;
export declare type LicenseSummary = Map<Name, Map<Version, License>>;
export declare type GroupedLicenseSummary = Array<{
    license: string;
    names: string[];
}>;
export declare class LicenseUtilities {
    private _p;
    constructor(_p: Package);
    get license(): string;
    private _isLicenseObject;
    get licenses(): LicenseSummary;
    get licensesByGroup(): GroupedLicenseSummary;
}
export {};
//# sourceMappingURL=LicenseUtilities.d.ts.map