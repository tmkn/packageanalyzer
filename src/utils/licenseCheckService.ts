import satisfies from "spdx-satisfies";

import { LicenseUtilities } from "../extensions/utilities/LicenseUtilities";
import { IPackage } from "../package/package";

export interface ILicenseCheckResult {
    ok: boolean;
    parseError: boolean;
}

interface ILicenseCheckReport {
    ok: boolean;
    allChecks: Map<IPackage, ILicenseCheckResult>;
    failedChecks: Map<IPackage, ILicenseCheckResult>;
    passedChecks: Map<IPackage, ILicenseCheckResult>;
}

export type LicenseCheckReport = Readonly<ILicenseCheckReport>;

class WhitelistLicenseCheckService {
    constructor(
        private _p: IPackage,
        private _whitelist: string[],
        private _includeSelf: Readonly<boolean>
    ) {}

    private _satisfiesLicense(packageLicense: string, spdxIdentifier: string): boolean {
        try {
            return satisfies(packageLicense, [spdxIdentifier]);
        } catch {
            return false;
        }
    }

    check(): ILicenseCheckReport {
        const visitedPackages: string[] = [];
        const all: Map<IPackage, ILicenseCheckResult> = new Map();
        const failedChecks: Map<IPackage, ILicenseCheckResult> = new Map();
        const passedChecks: Map<IPackage, ILicenseCheckResult> = new Map();

        this._p.visit(pkg => {
            if (visitedPackages.includes(pkg.fullName)) return;

            let result: ILicenseCheckResult | undefined;
            try {
                visitedPackages.push(pkg.fullName);
                result = {
                    ok: this._whitelist.some(license =>
                        this._satisfiesLicense(new LicenseUtilities(pkg).license, license)
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
            } catch {
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
    pkg: IPackage,
    whitelist: string[],
    includeSelf: boolean
): LicenseCheckReport {
    const licenseCheckService = new WhitelistLicenseCheckService(pkg, whitelist, includeSelf);

    return licenseCheckService.check();
}
