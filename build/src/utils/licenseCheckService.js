"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWhitelistLicenseCheckReport = void 0;
const satisfies = require("spdx-satisfies");
const LicenseUtilities_1 = require("../extensions/utilities/LicenseUtilities");
class WhitelistLicenseCheckService {
    constructor(_p, _whitelist, _includeSelf) {
        this._p = _p;
        this._whitelist = _whitelist;
        this._includeSelf = _includeSelf;
    }
    _satisfiesLicense(packageLicense, spdxIdentifier) {
        try {
            return satisfies(packageLicense, spdxIdentifier);
        }
        catch {
            return false;
        }
    }
    check() {
        const visitedPackages = [];
        const all = new Map();
        const failedChecks = new Map();
        const passedChecks = new Map();
        this._p.visit(pkg => {
            if (visitedPackages.includes(pkg.fullName))
                return;
            let result;
            try {
                visitedPackages.push(pkg.fullName);
                result = {
                    ok: this._whitelist.some(license => this._satisfiesLicense(new LicenseUtilities_1.LicenseUtilities(pkg).license, license)),
                    parseError: false
                };
                if (result.ok) {
                    all.set(pkg, result);
                    passedChecks.set(pkg, result);
                }
                else {
                    all.set(pkg, result);
                    failedChecks.set(pkg, result);
                }
            }
            catch (e) {
                result = {
                    ok: false,
                    parseError: true
                };
                all.set(pkg, result);
                failedChecks.set(pkg, result);
            }
            finally {
                if (result)
                    all.set(pkg, result);
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
function createWhitelistLicenseCheckReport(pkg, whitelist, includeSelf) {
    const licenseCheckService = new WhitelistLicenseCheckService(pkg, whitelist, includeSelf);
    return licenseCheckService.check();
}
exports.createWhitelistLicenseCheckReport = createWhitelistLicenseCheckReport;
//# sourceMappingURL=licenseCheckService.js.map