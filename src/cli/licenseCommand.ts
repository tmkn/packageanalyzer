import { Command } from "clipanion";
import * as chalk from "chalk";

import { npmOnline, OnlinePackageProvider } from "../providers/online";
import { Package } from "../package/package";
import { getNameAndVersion, Visitor } from "../visitors/visitor";
import { FileSystemPackageProvider } from "../providers/folder";
import { getPackageJson } from "../visitors/folder";
import { OraLogger } from "../utils/logger";
import { defaultDependencyType, isValidDependencyType } from "./common";
import {
    createWhitelistLicenseCheckReport,
    ILicenseCheckResult,
    LicenseCheckReport
} from "../utils/licenseCheckService";
import { Formatter, IFormatter } from "../utils/formatter";
import { LicenseMetrics } from "../extensions/metrics/LicenseMetrics";

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

        const formatter = new Formatter(this.context.stdout);

        if (typeof this.package !== `undefined` && typeof this.folder !== `undefined`) {
            this.context.stdout.write(`Please specify a package or folder.\n`);
        } else if (typeof this.package !== `undefined`) {
            const visitor = new Visitor(
                getNameAndVersion(this.package),
                LicenseCheckCommand.OnlineProvider,
                new OraLogger()
            );
            const p = await visitor.visit(this.type);
            const licenseReport = createWhitelistLicenseCheckReport(p, this.allowList ?? [], true);

            printLicenseCheck(licenseReport, this.grouped, formatter);

            if (!licenseReport.ok) process.exitCode = 1;
        } else if (typeof this.folder !== `undefined`) {
            const provider = new FileSystemPackageProvider(this.folder);
            const visitor = new Visitor(getPackageJson(this.folder), provider, new OraLogger());
            const p: Package = await visitor.visit(this.type);
            const licenseReport = createWhitelistLicenseCheckReport(p, this.allowList ?? [], false);

            printLicenseCheck(licenseReport, this.grouped, formatter);

            if (!licenseReport.ok) process.exitCode = 1;
        }
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
            const existingGroup = groups.get(new LicenseMetrics(p).license);

            if (existingGroup) {
                existingGroup.set(p, result);
            } else {
                groups.set(new LicenseMetrics(p).license, new Map([[p, result]]));
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
            const str = `${p.fullName.padEnd(padding + 1)}${new LicenseMetrics(p).license}`;

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
