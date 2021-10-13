import * as chalk from "chalk";

import { defaultDependencyType } from "../cli/common";
import { LicenseUtilities } from "../extensions/utilities/LicenseUtilities";
import { Package } from "../package/package";
import { FileSystemPackageProvider } from "../providers/folder";
import { npmOnline } from "../providers/online";
import { IFormatter } from "../utils/formatter";
import {
    createWhitelistLicenseCheckReport,
    ILicenseCheckResult,
    LicenseCheckReport
} from "../utils/licenseCheckService";
import {
    DependencyTypes,
    getPackageVersionFromPackageJson,
    getPackageVersionfromString,
    PackageVersion
} from "../visitors/visitor";
import { AbstractReport } from "./Report";

export interface ILicenseParams {
    package?: string;
    folder?: string;
    type?: DependencyTypes;
    allowList?: string[];
    grouped?: boolean;
}

export class LicenseReport extends AbstractReport<ILicenseParams> {
    name = `License Report`;
    readonly pkg: PackageVersion;

    allowList: string[];
    grouped: boolean;

    constructor(readonly params: ILicenseParams) {
        super();

        if (params.package) {
            this.pkg = getPackageVersionfromString(params.package);
            this.provider = npmOnline;
        } else if (params.folder) {
            this.pkg = getPackageVersionFromPackageJson(params.folder);
            this.provider = new FileSystemPackageProvider(params.folder);
        } else throw new Error(`Must provide package or folder option`);

        this.type = params.type ?? defaultDependencyType;
        this.allowList = params.allowList ?? [];
        this.grouped = params.grouped ?? false;
    }

    async report(pkg: Package, formatter: IFormatter): Promise<void> {
        const licenseReport = createWhitelistLicenseCheckReport(pkg, this.allowList ?? [], false);

        printLicenseCheck(licenseReport, this.grouped, formatter);
    }
}

function printLicenseCheck(
    licenseReport: LicenseCheckReport,
    grouped: boolean,
    formatter: IFormatter
): void {
    const licensePrinter = new LicenseCheckPrinter(licenseReport, formatter);

    if (grouped) licensePrinter.printGroupedByLicense();
    else licensePrinter.printLicenses();
}

class LicenseCheckPrinter {
    constructor(private _licenseCheckResult: LicenseCheckReport, private _formatter: IFormatter) {}

    public groupedByLicense(): Map<Package, ILicenseCheckResult>[] {
        const groups: Map<string, Map<Package, ILicenseCheckResult>> = new Map();

        for (const [p, result] of this._licenseCheckResult.allChecks) {
            const existingGroup = groups.get(new LicenseUtilities(p).license);

            if (existingGroup) {
                existingGroup.set(p, result);
            } else {
                groups.set(new LicenseUtilities(p).license, new Map([[p, result]]));
            }
        }

        return [...groups.values()];
    }

    public printGroupedByLicense(): void {
        const licenses = this.groupedByLicense();

        for (const group of licenses) {
            this._print(group);
        }
        this._printSummary();
    }

    public printLicenses(): void {
        this._print(this._licenseCheckResult.allChecks);
        this._printSummary();
    }

    private _print(data: Map<Package, ILicenseCheckResult>): void {
        let padding = [...data.keys()].reduce(
            (previous, current) =>
                current.fullName.length > previous ? current.fullName.length : previous,
            0
        );

        const sorted = [...data].sort(([pa1], [pa2]) => pa1.name.localeCompare(pa2.name));

        for (const [p, result] of sorted) {
            const str = `${p.fullName.padEnd(padding + 1)}${new LicenseUtilities(p).license}`;

            if (result.ok) {
                this._formatter.writeLine(`${chalk.green(str)}`);
            } else {
                this._formatter.writeLine(`${chalk.redBright(str)}`);
            }
        }
    }

    private _printSummary(): void {
        const { ok, allChecks, failedChecks } = this._licenseCheckResult;
        const failedToParseChecks: Map<Package, ILicenseCheckResult> = new Map();
        const failedToSatisfyLicense: Map<Package, ILicenseCheckResult> = new Map();

        if (ok) {
            this._formatter.writeLine(`\nAll packages passed the license check`);
        } else {
            for (const [p, result] of failedChecks) {
                if (result.parseError) {
                    failedToParseChecks.set(p, result);
                } else {
                    failedToSatisfyLicense.set(p, result);
                }
            }
        }

        if (failedToSatisfyLicense.size > 0) {
            this._formatter.writeLine(
                `\n${failedToSatisfyLicense.size}/${allChecks.size} packages failed the license check`
            );
            this._print(failedToSatisfyLicense);
        }

        if (failedToParseChecks.size > 0) {
            this._formatter.writeLine(
                `\n${failedToParseChecks.size}/${allChecks.size} licenses couldn't be parsed`
            );
            this._print(failedToParseChecks);
        }
    }
}
