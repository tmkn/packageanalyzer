//import * as satisfies from "spdx-satisfies";
const satisfies = require("spdx-satisfies");

import { PackageAnalytics } from "../analyzers/package";

export interface ILicenseCheckResult {
    ok: boolean;
    parseError: boolean;
}

interface ILicenseCheckReport {
    ok: boolean;
    allChecks: Map<PackageAnalytics, ILicenseCheckResult>;
    failedChecks: Map<PackageAnalytics, ILicenseCheckResult>;
    passedChecks: Map<PackageAnalytics, ILicenseCheckResult>;
}

export type LicenseCheckReport = Readonly<ILicenseCheckReport>;

export interface ILicenseCheckService {
    check(): ILicenseCheckReport;
}

class WhitelistLicenseCheckService implements ILicenseCheckService {
    constructor(
        private _pa: PackageAnalytics,
        private _whitelist: string[],
        private _includeSelf: Readonly<boolean>
    ) {}

    private _satisfiesLicense(packageLicense: string, spdxIdentifier: string): boolean {
        try {
            return satisfies(packageLicense, spdxIdentifier);
        } catch {
            return false;
        }
    }

    check(): ILicenseCheckReport {
        const distinctPackages: string[] = [];
        const all: Map<PackageAnalytics, ILicenseCheckResult> = new Map();
        const failedChecks: Map<PackageAnalytics, ILicenseCheckResult> = new Map();
        const passedChecks: Map<PackageAnalytics, ILicenseCheckResult> = new Map();

        this._pa.visit(pkg => {
            if (distinctPackages.includes(pkg.fullName)) return;

            let result: ILicenseCheckResult | undefined;
            try {
                distinctPackages.push(pkg.fullName);
                result = {
                    ok: this._whitelist.some(license =>
                        this._satisfiesLicense(pkg.license, license)
                    ),
                    parseError: false
                };

                if (result.ok) {
                    all.set(pkg, result);
                    passedChecks.set(pkg, result);
                } else {
                    all.set(pkg, result);
                    failedChecks.set(pkg, result);
                }
            } catch (e: unknown) {
                result = {
                    ok: false,
                    parseError: true
                };

                all.set(pkg, result);
                failedChecks.set(pkg, result);
            } finally {
                if (result) all.set(pkg, result);
            }
        }, this._includeSelf);

        return {
            ok: failedChecks.size === 0,
            allChecks: all,
            failedChecks,
            passedChecks
        };
    }
}

export function createWhitelistLicenseCheckReport(
    pkg: PackageAnalytics,
    whitelist: string[],
    includeSelf: boolean
): LicenseCheckReport {
    const licenseCheckService = new WhitelistLicenseCheckService(pkg, whitelist, includeSelf);

    return licenseCheckService.check();
}
