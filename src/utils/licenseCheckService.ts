const satisfies = require("spdx-satisfies");

import { Package } from "../analyzers/package";
import { LicenseMetrics } from "../extensions/metrics/LicenseMetrics";

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

export type LicenseCheckReport = Readonly<ILicenseCheckReport>;

class WhitelistLicenseCheckService {
    constructor(
        private _p: Package,
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
        const visitedPackages: string[] = [];
        const all: Map<Package, ILicenseCheckResult> = new Map();
        const failedChecks: Map<Package, ILicenseCheckResult> = new Map();
        const passedChecks: Map<Package, ILicenseCheckResult> = new Map();

        this._p.visit(pkg => {
            if (visitedPackages.includes(pkg.fullName)) return;

            let result: ILicenseCheckResult | undefined;
            try {
                visitedPackages.push(pkg.fullName);
                result = {
                    ok: this._whitelist.some(license =>
                        this._satisfiesLicense(new LicenseMetrics(pkg).license, license)
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
    pkg: Package,
    whitelist: string[],
    includeSelf: boolean
): LicenseCheckReport {
    const licenseCheckService = new WhitelistLicenseCheckService(pkg, whitelist, includeSelf);

    return licenseCheckService.check();
}
