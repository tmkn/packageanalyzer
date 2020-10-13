//import * as satisfies from "spdx-satisfies";
const satisfies = require("spdx-satisfies");

import { PackageAnalytics } from "../analyzers/package";

export interface ILicenseCheckResult {
    ok: boolean;
    parseError: boolean;
}

export interface ILicenseCheckReport {
    ok: boolean;
    allChecks: Map<PackageAnalytics, ILicenseCheckResult>;
    failedChecks: Map<PackageAnalytics, ILicenseCheckResult>;
    passedChecks: Map<PackageAnalytics, ILicenseCheckResult>;
}

export interface ILicenseCheckService {
    check(): ILicenseCheckReport;
}

export class WhitelistLicenseCheckService implements ILicenseCheckService {
    constructor(
        private _pa: PackageAnalytics,
        private _whitelist: string[],
        private _includeSelf: Readonly<boolean>
    ) {}

    check(): ILicenseCheckReport {
        const distinctPackages: string[] = [];
        const all: Map<PackageAnalytics, ILicenseCheckResult> = new Map();
        const failedChecks: Map<PackageAnalytics, ILicenseCheckResult> = new Map();
        const passedChecks: Map<PackageAnalytics, ILicenseCheckResult> = new Map();

        this._pa.visit(pkg => {
            if (distinctPackages.includes(pkg.fullName)) return;

            try {
                distinctPackages.push(pkg.fullName);
                const result: ILicenseCheckResult = {
                    ok: this._whitelist.some(license => satisfies(license, pkg.license)),
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
                const result: ILicenseCheckResult = {
                    ok: false,
                    parseError: true
                };

                all.set(pkg, result);
                failedChecks.set(pkg, result);
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
