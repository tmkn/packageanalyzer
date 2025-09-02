import { Command, Option } from "clipanion";

import { LintFileLoader } from "../reports/lint/RulesLoader.js";
import { getPackageVersionfromString } from "../visitors/visitor.js";
import { npmOnline } from "../providers/online.js";
import { FileSystemPackageProvider } from "../providers/folder.js";
import { getPackageVersionFromPath } from "../visitors/util.node.js";
import { CliCommand } from "./common.js";
import { LintReport } from "../reports/lint/LintReport.js";

export class LintCommand extends CliCommand<LintReport> {
    public lintFile = Option.String();

    public depth = Option.String(`--depth`, "no_valid_number", {
        description: `how deep to analyze the dependency tree`
    });

    public package = Option.String(`--package`, {
        description: `the package to analyze e.g. typescript, typescript@3.5.1`
    });

    public folder = Option.String(`--folder`, { description: `path to a package.json` });

    static override readonly usage = Command.Usage({
        description: `lint your dependency tree`,
        details: `
            This command will lint your dependency tree and print out the results
        `,
        examples: [
            [
                `Lint a local project`,
                `$0 lint --folder /path/to/your/package.json /path/to/lintconfig.js`
            ],
            [`Lint a dependency`, `$0 lint --package package /path/to/lintconfig.js`],
            [
                `Lint a specific version of a dependency`,
                `$0 lint --package package@version /path/to/lintconfig.js`
            ]
        ]
    });

    static override readonly paths = [[`lint`]];

    async getReports(): Promise<LintReport> {
        const loader = new LintFileLoader(this.lintFile);
        const rules = await loader.getRules();

        let depth = parseInt(this.depth, 10);
        if (isNaN(depth)) {
            depth = Infinity;
        }

        if (this.package) {
            const report = new LintReport({
                depth,
                lintFile: rules,
                entry: getPackageVersionfromString(this.package)
            });

            report.provider = npmOnline;

            return report;
        } else if (this.folder) {
            const report = new LintReport({
                depth,
                lintFile: rules,
                entry: getPackageVersionFromPath(this.folder)
            });

            report.provider = new FileSystemPackageProvider(this.folder);

            return report;
        } else {
            throw new Error(`No package nor folder option was provided`);
        }
    }

    // beforeProcess: ((config: ILintServiceConfig) => void) | undefined = undefined;
}
