import { Command, Option } from "clipanion";

import { ILicenseParams, LicenseReport } from "../reports/LicenseReport";
import { CliCommand, defaultDependencyType, isValidDependencyType } from "./common";

export class LicenseCheckCommand extends CliCommand<LicenseReport> {
    public package = Option.String(`--package`, {
        description: `the package to analyze e.g. typescript, typescript@3.5.1`
    });

    public type = Option.String(`--type`, defaultDependencyType, {
        description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
    });

    public allowList = Option.Array(`--allow`, {
        description: `the type of dependencies you want to allow"`
    });

    public grouped = Option.Boolean(`--grouped`, false, {
        description: `specificies if the data should be grouped by license`
    });

    public folder = Option.String(`--folder`, { description: `path to a package.json` });

    static override usage = Command.Usage({
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

    static override paths = [[`license`]];

    createReport(): LicenseReport {
        if (!isValidDependencyType(this.type)) {
            throw new Error(
                `Please only specify "dependencies" or "devDependencies" for the --type argument`
            );
        }

        if (this.folder) {
            const params: ILicenseParams = {
                type: this.type,
                folder: this.folder,
                package: this.package,
                allowList: this.allowList,
                grouped: this.grouped
            };

            return new LicenseReport(params);
        } else if (this.package) {
            const params: ILicenseParams = {
                type: this.type,
                folder: this.folder,
                package: this.package,
                allowList: this.allowList,
                grouped: this.grouped
            };

            return new LicenseReport(params);
        }

        throw new Error(`No package nor folder option was provided`);
    }
}
