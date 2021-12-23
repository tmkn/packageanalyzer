import { Command, Option } from "clipanion";
import { IPackageJsonProvider } from "../providers/provider";

import { ILicenseParams, LicenseReport } from "../reports/LicenseReport";
import { ReportService } from "../reports/ReportService";
import { defaultDependencyType, isValidDependencyType } from "./common";

export class LicenseCheckCommand extends Command {
    public package?: string = Option.String(`--package`, {
        description: `the package to analyze e.g. typescript, typescript@3.5.1`
    });

    public type: string = Option.String(`--type`, defaultDependencyType, {
        description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
    });

    public allowList?: string[] = Option.Array(`--allow`, {
        description: `the type of dependencies you want to allow"`
    });

    public grouped: boolean = Option.Boolean(`--grouped`, false, {
        description: `specificies if the data should be grouped by license`
    });

    public folder?: string = Option.String(`--folder`, { description: `path to a package.json` });

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

    public static provider: IPackageJsonProvider | undefined = undefined;

    static override paths = [[`license`]];
    async execute() {
        if (!isValidDependencyType(this.type)) {
            throw new Error(
                `Please only specify "dependencies" or "devDependencies" for the --type argument`
            );
        }

        const params: ILicenseParams = {
            type: this.type,
            folder: this.folder,
            package: this.package,
            allowList: this.allowList,
            grouped: this.grouped
        };
        const licenseReport = new LicenseReport(params);
        licenseReport.provider = licenseReport.provider ?? LicenseCheckCommand.provider;

        const reportService = new ReportService(
            {
                reports: [licenseReport]
            },
            this.context.stdout,
            this.context.stderr
        );

        await reportService.process();
    }
}
