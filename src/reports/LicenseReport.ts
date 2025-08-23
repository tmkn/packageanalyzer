import { z } from "zod";
import chalk from "chalk";

import { defaultDependencyType } from "../cli/common.js";
import { LicenseUtilities } from "../extensions/utilities/LicenseUtilities.js";
import { type IPackage } from "../package/package.js";
import { FileSystemPackageProvider } from "../providers/folder.js";
import { type IFormatter } from "../utils/formatter.js";
import {
    createWhitelistLicenseCheckReport,
    type ILicenseCheckResult,
    type LicenseCheckReport
} from "../utils/licenseCheckService.js";
import { getPackageVersionFromPath } from "../visitors/util.node.js";
import { getPackageVersionfromString } from "../visitors/visitor.js";
import { AbstractReport, type IReportConfig, type IReportContext } from "./Report.js";
import { dependencyTypes, BaseFolderParameter, BasePackageParameter } from "./Validation.js";

const OptionalParams = z.object({
    type: z.optional(dependencyTypes),
    allowList: z.optional(z.array(z.string())),
    grouped: z.optional(z.boolean())
});

const PackageParams = BasePackageParameter.merge(OptionalParams);
const FolderParams = BaseFolderParameter.merge(OptionalParams);

const LicenseParams = z.union([PackageParams, FolderParams]);

export type ILicenseParams = z.infer<typeof LicenseParams>;

export class LicenseReport extends AbstractReport<ILicenseParams> {
    name = `License Report`;
    configs: IReportConfig;

    allowList: string[];
    grouped: boolean;

    constructor(params: ILicenseParams) {
        super(params);

        const type = params.type ?? defaultDependencyType;
        if (this._isPackageParams(params)) {
            this.configs = {
                pkg: getPackageVersionfromString(params.package),
                type
            };
        } else {
            this.configs = {
                pkg: getPackageVersionFromPath(params.folder),
                type
            };
            this.provider = new FileSystemPackageProvider(params.folder);
        }

        this.allowList = params.allowList ?? [];
        this.grouped = params.grouped ?? false;
    }

    async report([pkg]: [IPackage], { stdoutFormatter }: IReportContext): Promise<void> {
        const licenseReport = createWhitelistLicenseCheckReport(pkg, this.allowList, false);

        printLicenseCheck(licenseReport, this.grouped, stdoutFormatter);
    }

    private _isPackageParams(data: unknown): data is z.infer<typeof PackageParams> {
        return PackageParams.safeParse(data).success;
    }

    override validate(): z.ZodType<ILicenseParams> {
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
    constructor(
        private _licenseCheckResult: LicenseCheckReport,
        private _formatter: IFormatter
    ) {}

    public groupedByLicense(): Map<IPackage, ILicenseCheckResult>[] {
        const groups: Map<string, Map<IPackage, ILicenseCheckResult>> = new Map();

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

    private _print(data: Map<IPackage, ILicenseCheckResult>): void {
        const padding = [...data.keys()].reduce(
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
        const failedToParseChecks: Map<IPackage, ILicenseCheckResult> = new Map();
        const failedToSatisfyLicense: Map<IPackage, ILicenseCheckResult> = new Map();

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
