import { Command, Option } from "clipanion";

import { CliCommand, defaultDependencyType } from "./common.js";
import { type ITreeReportParams, TreeReport } from "../reports/TreeReport.js";
import { type DependencyTypes } from "../reports/Validation.js";

export class TreeCommand extends CliCommand<TreeReport> {
    public package = Option.String(`--package`, {
        description: `the package to display the dependency tree e.g. typescript@3.5.1`
    });

    public type: DependencyTypes = Option.String(`--type`, defaultDependencyType, {
        description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
    });

    public folder = Option.String(`--folder`, {
        description: `path to a package.json`
    });

    static override usage = Command.Usage({
        description: `show the dependency tree of a NPM package or a local project`,
        details: `
            This command will print the dependency tree of a NPM package or a local project.\n
            Defaults to dependencies, use the \`--type\` argument to specify devDependencies
        `,
        examples: [
            [
                `Show the dependency tree for a NPM package for the latest version`,
                `$0 tree --package typescript`
            ],
            [
                `Show the dependency tree for a NPM package for a specific version`,
                `$0 tree --package typescript@3.5.1`
            ],
            [
                `Show the dependency tree for devDependencies`,
                `$0 tree --package typescript@3.5.1 --type=devDependencies`
            ],
            [
                `Show the dependency tree for a local folder`,
                `$0 analyze --folder ./path/to/your/package.json`
            ]
        ]
    });

    static override paths = [[`tree`]];

    getReport(): TreeReport {
        if (this.folder) {
            const params: ITreeReportParams = {
                type: this.type,
                folder: this.folder
            };

            return new TreeReport(params);
        }

        if (this.package) {
            const params: ITreeReportParams = {
                type: this.type,
                package: this.package
            };

            return new TreeReport(params);
        }

        throw new Error(`No package nor folder option was provided`);
    }
}
