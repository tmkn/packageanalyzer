import { Command, Option } from "clipanion";

import { defaultDependencyType, isValidDependencyType } from "./common";
import { ILoopParams, LoopsReport } from "../reports/LoopsReport";
import { ReportService } from "../reports/ReportService";

export class LoopsCommand extends Command {
    public package?: string = Option.String(`--package`, {
        description: `the package to retrieve the loop info e.g. typescript@3.5.1`
    });

    public type: string = Option.String(`--type`, defaultDependencyType, {
        description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
    });

    static override usage = Command.Usage({
        description: `show loops in the dependency tree`,
        details: `
            This command will show loops in the dependency tree.\n
            Defaults to dependencies, use the \`--type\` argument to specify devDependencies
        `,
        examples: [
            [
                `Show dependency loops for a NPM package for the latest version`,
                `$0 loops --package typescript`
            ],
            [
                `Show dependency loops for a NPM package for a specific version`,
                `$0 tree --package typescript@3.5.1`
            ],
            [
                `Show dependency loops for devDependencies`,
                `$0 tree --package typescript@3.5.1 --type=devDependencies`
            ]
        ]
    });

    static override paths = [[`loops`]];
    async execute() {
        if (!isValidDependencyType(this.type)) {
            throw new Error(
                `Please only specify "dependencies" or "devDependencies" for the --type argument`
            );
        }

        if (typeof this.package !== "undefined") {
            const params: ILoopParams = {
                type: this.type,
                package: this.package
            };
            const loopsReport = new LoopsReport(params);

            const reportService = new ReportService(
                {
                    reports: [loopsReport]
                },
                this.context.stdout
            );

            await reportService.process();
        }
    }
}
