import * as t from "io-ts";
import * as chalk from "chalk";

import { defaultDependencyType } from "../cli/common";
import { LicenseUtilities } from "../extensions/utilities/LicenseUtilities";
import { Package } from "../package/package";
import { FileSystemPackageProvider } from "../providers/folder";
import { IFormatter } from "../utils/formatter";
import {
    createWhitelistLicenseCheckReport,
    ILicenseCheckResult,
    LicenseCheckReport
} from "../utils/licenseCheckService";
import { getPackageVersionFromPath } from "../visitors/util.node";
import { getPackageVersionfromString, PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";
import { BaseFolderParameter, BasePackageParameter, dependencyType } from "./Validation";

const OptionalParams = t.partial({
    type: dependencyType,
    allowList: t.array(t.string),
    grouped: t.boolean
});

const PackageParams = t.intersection([BasePackageParameter, OptionalParams]);
const FolderParams = t.intersection([BaseFolderParameter, OptionalParams]);

const LicenseParams = t.union([PackageParams, FolderParams]);

export type ILicenseParams = t.TypeOf<typeof LicenseParams>;

export class LicenseReport extends AbstractReport<ILicenseParams> {
    name = `License Report`;
    readonly pkg: PackageVersion;

    allowList: string[];
    grouped: boolean;

    constructor(params: ILicenseParams) {
        super(params);

        if (PackageParams.is(params)) {
            this.pkg = getPackageVersionfromString(params.package);
        } else if (FolderParams.is(params)) {
            this.pkg = getPackageVersionFromPath(params.folder);
            this.provider = new FileSystemPackageProvider(params.folder);
        } else throw new Error(`Must provide package or folder option`);

        this.type = params.type ?? defaultDependencyType;
        this.allowList = params.allowList ?? [];
        this.grouped = params.grouped ?? false;
    }

    async report(pkg: Package, { stdoutFormatter }: IReportContext): Promise<void> {
        const licenseReport = createWhitelistLicenseCheckReport(pkg, this.allowList ?? [], false);

        printLicenseCheck(licenseReport, this.grouped, stdoutFormatter);
    }

    validate(): t.Type<ILicenseParams> {
        return LicenseParams;
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
