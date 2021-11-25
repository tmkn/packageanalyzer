"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseReport = void 0;
const chalk = require("chalk");
const common_1 = require("../cli/common");
const LicenseUtilities_1 = require("../extensions/utilities/LicenseUtilities");
const folder_1 = require("../providers/folder");
const online_1 = require("../providers/online");
const licenseCheckService_1 = require("../utils/licenseCheckService");
const utils_1 = require("../visitors/utils");
const Report_1 = require("./Report");
class LicenseReport extends Report_1.AbstractReport {
    constructor(params) {
        super();
        this.params = params;
        this.name = `License Report`;
        if (params.package) {
            this.pkg = (0, utils_1.getPackageVersionfromString)(params.package);
            this.provider = online_1.npmOnline;
        }
        else if (params.folder) {
            this.pkg = (0, utils_1.getPackageVersionFromPackageJson)(params.folder);
            this.provider = new folder_1.FileSystemPackageProvider(params.folder);
        }
        else
            throw new Error(`Must provide package or folder option`);
        this.type = params.type ?? common_1.defaultDependencyType;
        this.allowList = params.allowList ?? [];
        this.grouped = params.grouped ?? false;
    }
    async report(pkg, { stdoutFormatter }) {
        const licenseReport = (0, licenseCheckService_1.createWhitelistLicenseCheckReport)(pkg, this.allowList ?? [], false);
        printLicenseCheck(licenseReport, this.grouped, stdoutFormatter);
    }
}
exports.LicenseReport = LicenseReport;
function printLicenseCheck(licenseReport, grouped, formatter) {
    const licensePrinter = new LicenseCheckPrinter(licenseReport, formatter);
    if (grouped)
        licensePrinter.printGroupedByLicense();
    else
        licensePrinter.printLicenses();
}
class LicenseCheckPrinter {
    constructor(_licenseCheckResult, _formatter) {
        this._licenseCheckResult = _licenseCheckResult;
        this._formatter = _formatter;
    }
    groupedByLicense() {
        const groups = new Map();
        for (const [p, result] of this._licenseCheckResult.allChecks) {
            const existingGroup = groups.get(new LicenseUtilities_1.LicenseUtilities(p).license);
            if (existingGroup) {
                existingGroup.set(p, result);
            }
            else {
                groups.set(new LicenseUtilities_1.LicenseUtilities(p).license, new Map([[p, result]]));
            }
        }
        return [...groups.values()];
    }
    printGroupedByLicense() {
        const licenses = this.groupedByLicense();
        for (const group of licenses) {
            this._print(group);
        }
        this._printSummary();
    }
    printLicenses() {
        this._print(this._licenseCheckResult.allChecks);
        this._printSummary();
    }
    _print(data) {
        let padding = [...data.keys()].reduce((previous, current) => current.fullName.length > previous ? current.fullName.length : previous, 0);
        const sorted = [...data].sort(([pa1], [pa2]) => pa1.name.localeCompare(pa2.name));
        for (const [p, result] of sorted) {
            const str = `${p.fullName.padEnd(padding + 1)}${new LicenseUtilities_1.LicenseUtilities(p).license}`;
            if (result.ok) {
                this._formatter.writeLine(`${chalk.green(str)}`);
            }
            else {
                this._formatter.writeLine(`${chalk.redBright(str)}`);
            }
        }
    }
    _printSummary() {
        const { ok, allChecks, failedChecks } = this._licenseCheckResult;
        const failedToParseChecks = new Map();
        const failedToSatisfyLicense = new Map();
        if (ok) {
            this._formatter.writeLine(`\nAll packages passed the license check`);
        }
        else {
            for (const [p, result] of failedChecks) {
                if (result.parseError) {
                    failedToParseChecks.set(p, result);
                }
                else {
                    failedToSatisfyLicense.set(p, result);
                }
            }
        }
        if (failedToSatisfyLicense.size > 0) {
            this._formatter.writeLine(`\n${failedToSatisfyLicense.size}/${allChecks.size} packages failed the license check`);
            this._print(failedToSatisfyLicense);
        }
        if (failedToParseChecks.size > 0) {
            this._formatter.writeLine(`\n${failedToParseChecks.size}/${allChecks.size} licenses couldn't be parsed`);
            this._print(failedToParseChecks);
        }
    }
}
//# sourceMappingURL=LicenseReport.js.map