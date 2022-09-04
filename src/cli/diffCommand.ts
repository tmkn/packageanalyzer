import { Command, Option } from "clipanion";

import { CliCommand, defaultDependencyType } from "./common";
import { DependencyTypes } from "../reports/Validation";
import { DiffReport, IDiffReportParams } from "../reports/DiffReport";

export class DiffCommand extends CliCommand<DiffReport> {
    public package = Option.String(`--package`, {
        description: `the package to display the dependency tree e.g. typescript@3.5.1`
    });

    public range = Option.Array(`--range`, {
        arity: 2,
        description: `the 2 packages to compare e.g. typescript@3.5.1 typescript@4.8.2`
    });

    public type: DependencyTypes = Option.String(`--type`, defaultDependencyType, {
        description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
    });

    // static override usage = Command.Usage({
    //     description: `show the dependency tree of a NPM package or a local project`,
    //     details: `
    //         This command will print the dependency tree of a NPM package or a local project.\n
    //         Defaults to dependencies, use the \`--type\` argument to specify devDependencies
    //     `,
    //     examples: [
    //         [
    //             `Show the dependency tree for a NPM package for the latest version`,
    //             `$0 tree --package typescript`
    //         ],
    //         [
    //             `Show the dependency tree for a NPM package for a specific version`,
    //             `$0 tree --package typescript@3.5.1`
    //         ],
    //         [
    //             `Show the dependency tree for devDependencies`,
    //             `$0 tree --package typescript@3.5.1 --type=devDependencies`
    //         ],
    //         [
    //             `Show the dependency tree for a local folder`,
    //             `$0 analyze --folder ./path/to/your/package.json`
    //         ]
    //     ]
    // });

    static override paths = [[`diff`]];

    getReport(): DiffReport {
        const [pkg1, pkg2] = this.range?.[0] ?? [];

        if (pkg1 && pkg2) {
            const params: IDiffReportParams = {
                type: this.type,
                from: pkg1,
                to: pkg2
            };

            return new DiffReport(params);
        }

        throw new Error(`No range option was provided`);
    }
}
