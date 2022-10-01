import { Command, Option } from "clipanion";

import { CliCommand, defaultDependencyType } from "./common";
import { DependencyTypes } from "../reports/Validation";
import { DiffReport, IDiffReportParams } from "../reports/DiffReport";

export class DiffCommand extends CliCommand<DiffReport> {
    public range = Option.Array(`--range`, {
        arity: 2,
        description: `the 2 packages to compare e.g. typescript@3.5.1 typescript@4.8.2`
    });

    public type: DependencyTypes = Option.String(`--type`, defaultDependencyType, {
        description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
    });

    static override usage = Command.Usage({
        description: `compare the dependencies of 2 packages`,
        details: `
            This command will print a summary of the dependency differences between 2 packages.\n
            Useful to compare 2 versions of the same package.
        `,
        examples: [
            [
                `Show dependency differences between 2 versions of react`,
                `$0 diff --range react@16.13.1 react@17.0.1`
            ],
            [
                `Show dependency differences with the latest version of react`,
                `$0 diff --range react@16.13.1 react`
            ]
        ]
    });

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
