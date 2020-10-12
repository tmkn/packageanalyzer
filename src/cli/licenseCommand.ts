import { Command } from "clipanion";
import * as chalk from "chalk";

import { npmOnline } from "../providers/online";
import { PackageAnalytics } from "../analyzers/package";
import { getNameAndVersion } from "../npm";
import { Visitor } from "../visitors/visitor";
import { FileSystemPackageProvider } from "../providers/folder";
import { getPackageJson } from "../visitors/folder";
import { OraLogger } from "../logger";
import { defaultDependencyType, isValidDependencyType } from "./common";

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
        description: `the type of dependencies you want to akkiw"`
    })
    public allow?: string[];

    @Command.Boolean(`--grouped`, {
        description: `specificies if the data should be grouped by license`
    })
    public grouped: boolean = false;

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

    @Command.String(`--folder`, { description: `path to a package.json` })
    public folder?: string;

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
            try {
                const visitor = new Visitor(
                    getNameAndVersion(this.package),
                    npmOnline,
                    new OraLogger()
                );
                const pa = await visitor.visit(this.type);
                const licenseService = new LicenseCheckService(pa, this.allow ?? []);

                if (this.grouped) licenseService.printGroupedByLicense();
                else licenseService.printLicenses();
            } catch (e) {
                console.log(e);
            }
        } else if (typeof this.folder !== `undefined`) {
            try {
                const provider = new FileSystemPackageProvider(this.folder);
                const visitor = new Visitor(getPackageJson(this.folder), provider, new OraLogger());
                const pa: PackageAnalytics = await visitor.visit(this.type);
                const licenseService = new LicenseCheckService(pa, this.allow ?? []);

                if (this.grouped) licenseService.printGroupedByLicense();
                else licenseService.printLicenses();
            } catch (e) {
                console.log(e);
            }
        }
    }
}

interface ILicenseInfo {
    passedCheck?: boolean; //todo fill in later
    name: string;
    version: string;
    fullName: string;
    license: string;
}

class LicenseCheckService {
    constructor(private _pa: PackageAnalytics, private _whitelist: string[]) {}

    private _checkLicense(licenseString: string): boolean | undefined {
        if (this._whitelist.length === 0) return undefined;

        //todo license check
        return false;
    }

    public check(): Readonly<ILicenseInfo>[] {
        const licenses: Map<string, ILicenseInfo> = new Map<string, ILicenseInfo>();
        let longestline = 0;

        this._pa.visit(dep => {
            licenses.set(dep.fullName, {
                passedCheck: this._checkLicense(dep.license),
                name: dep.name,
                version: dep.version,
                fullName: dep.fullName,
                license: dep.license
            });

            if (longestline < dep.fullName.length) longestline = dep.fullName.length;
        }, true);

        return [...licenses.values()];
    }

    public groupedByLicense(): Readonly<ILicenseInfo>[][] {
        const licenses = this.check();
        const groupedLicenses: ILicenseInfo[][] = [];
        const grouped: Map<string, ILicenseInfo[]> = new Map();

        for (const info of licenses) {
            if (grouped.has(info.license)) {
                grouped.get(info.license)?.push(info);
            } else {
                grouped.set(info.license, [info]);
            }
        }

        for (const licenseData of grouped.values()) {
            groupedLicenses.push(licenseData);
        }

        return groupedLicenses;
    }

    public printGroupedByLicense(): void {
        const licenses = this.groupedByLicense();

        for (const group of licenses) {
            this._print(group);
        }
    }

    public printLicenses(): void {
        const licenses = this.check();

        this._print(licenses);
    }

    private _print(data: ILicenseInfo[]): void {
        let padding = data.reduce(
            (previous, current) =>
                current.fullName.length > previous ? current.fullName.length : previous,
            0
        );

        for (const entry of data.sort((a, b) => a.name.localeCompare(b.name))) {
            const { fullName, license, passedCheck } = entry;
            const str = `${fullName.padEnd(padding + 1)}${license}`;

            if (typeof passedCheck !== "undefined") {
                if (passedCheck) {
                    console.log(chalk.green(str));
                } else {
                    console.log(chalk.redBright(str));
                }
            } else {
                console.log(str);
            }
        }
    }
}
