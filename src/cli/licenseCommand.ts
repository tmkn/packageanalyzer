import { Command } from "clipanion";
import * as chalk from "chalk";

import { npmOnline, OnlinePackageProvider } from "../providers/online";
import { PackageAnalytics } from "../analyzers/package";
import { getNameAndVersion } from "../npm";
import { Visitor } from "../visitors/visitor";
import { FileSystemPackageProvider } from "../providers/folder";
import { getPackageJson } from "../visitors/folder";
import { OraLogger } from "../logger";
import { defaultDependencyType, isValidDependencyType } from "./common";
import {
    createWhitelistLicenseCheckReport,
    ILicenseCheckResult,
    LicenseCheckReport
} from "../services/licenseCheckService";
import { Writable } from "stream";

export class LicenseCheckCommand extends Command {
    @Command.String(`--package`, {
        description: `the package to analyze e.g. typescript, typescript@3.5.1`
    })
    public package?: string;

    @Command.String(`--type`, {
        description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
    })
    public type?: string = defaultDependencyType;

    @Command.Array(`--allow`, {
        description: `the type of dependencies you want to allow"`
    })
    public allowList?: string[];

    @Command.Boolean(`--grouped`, {
        description: `specificies if the data should be grouped by license`
    })
    public grouped: boolean = false;

    @Command.String(`--folder`, { description: `path to a package.json` })
    public folder?: string;

    static usage = Command.Usage({
        description: `check the licenses for all packages in the dependency tree`,
        details: `
            This command will print license informations for all packages found in the dependency tree.\n
            Defaults to dependencies, use the \`--type\` argument to specify devDependencies
        `,
        examples: [
            [
                `Analyze licenses for the latest version of a dependency`,
                `$0 license --package typescript`
            ],
            [
                `Analyze licenses for a specific version of a dependency`,
                `$0 license --package typescript@3.5.1`
            ],
            [
                `Analyze a projects devDependencies licenses`,
                `$0 analyze --package typescript@3.5.1 --type=devDependencies`
            ],
            [
                `Analyze licenses for a local project`,
                `$0 analyze --folder /path/to/your/package.json`
            ],
            [
                `Analyze licenses and print the info grouped by license type`,
                `$0 license --package typescript@3.5.1 --grouped`
            ]
        ]
    });

    static OnlineProvider: OnlinePackageProvider = npmOnline;

    @Command.Path(`license`)
    async execute() {
        if (!isValidDependencyType(this.type)) {
            throw new Error(
                `Please only specify "dependencies" or "devDependencies" for the --type argument`
            );
        }

        if (typeof this.package !== `undefined` && typeof this.folder !== `undefined`) {
            this.context.stdout.write(`Please specify a package or folder.\n`);
        } else if (typeof this.package !== `undefined`) {
            const visitor = new Visitor(
                getNameAndVersion(this.package),
                LicenseCheckCommand.OnlineProvider,
                new OraLogger()
            );
            const pa = await visitor.visit(this.type);
            const licenseReport = createWhitelistLicenseCheckReport(pa, this.allowList ?? [], true);

            printLicenseCheck(licenseReport, this.grouped, this.context.stdout);

            if (!licenseReport.ok) process.exitCode = 1;
        } else if (typeof this.folder !== `undefined`) {
            const provider = new FileSystemPackageProvider(this.folder);
            const visitor = new Visitor(getPackageJson(this.folder), provider, new OraLogger());
            const pa: PackageAnalytics = await visitor.visit(this.type);
            const licenseReport = createWhitelistLicenseCheckReport(
                pa,
                this.allowList ?? [],
                false
            );

            printLicenseCheck(licenseReport, this.grouped, this.context.stdout);

            if (!licenseReport.ok) process.exitCode = 1;
        }
    }
}

function printLicenseCheck(
    licenseReport: LicenseCheckReport,
    grouped: boolean,
    stdout: Writable
): void {
    const licensePrinter = new LicenseCheckPrinter(licenseReport, stdout);

    if (grouped) licensePrinter.printGroupedByLicense();
    else licensePrinter.printLicenses();
}

class LicenseCheckPrinter {
    constructor(private _licenseCheckResult: LicenseCheckReport, private _stdout: Writable) {}

    public groupedByLicense(): Map<PackageAnalytics, ILicenseCheckResult>[] {
        const groups: Map<string, Map<PackageAnalytics, ILicenseCheckResult>> = new Map();

        for (const [pa, result] of this._licenseCheckResult.allChecks) {
            const existingGroup = groups.get(pa.license);

            if (existingGroup) {
                existingGroup.set(pa, result);
            } else {
                groups.set(pa.license, new Map([[pa, result]]));
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

    private _print(data: Map<PackageAnalytics, ILicenseCheckResult>): void {
        let padding = [...data.keys()].reduce(
            (previous, current) =>
                current.fullName.length > previous ? current.fullName.length : previous,
            0
        );

        const sorted = [...data].sort(([pa1], [pa2]) => pa1.name.localeCompare(pa2.name));

        for (const [pa, result] of sorted) {
            const str = `${pa.fullName.padEnd(padding + 1)}${pa.license}`;

            if (result.ok) {
                this._stdout.write(`${chalk.green(str)}\n`);
            } else {
                this._stdout.write(`${chalk.redBright(str)}\n`);
            }
        }
    }

    private _printSummary(): void {
        const { ok, allChecks, failedChecks } = this._licenseCheckResult;
        const failedToParseChecks: Map<PackageAnalytics, ILicenseCheckResult> = new Map();
        const failedToSatisfyLicense: Map<PackageAnalytics, ILicenseCheckResult> = new Map();

        if (ok) {
            this._stdout.write(`\nAll packages passed the license check\n`);
        } else {
            for (const [pa, result] of failedChecks) {
                if (result.parseError) {
                    failedToParseChecks.set(pa, result);
                } else {
                    failedToSatisfyLicense.set(pa, result);
                }
            }
        }

        if (failedToSatisfyLicense.size > 0) {
            this._stdout.write(
                `\n${failedToSatisfyLicense.size}/${allChecks.size} packages failed the license check\n`
            );
            this._print(failedToSatisfyLicense);
        }

        if (failedToParseChecks.size > 0) {
            this._stdout.write(
                `\n${failedToParseChecks.size}/${allChecks.size} licenses couldn't be parsed\n`
            );
            this._print(failedToParseChecks);
        }
    }
}
