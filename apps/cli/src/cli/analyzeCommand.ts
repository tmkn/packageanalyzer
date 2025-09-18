import { Command, Option } from "clipanion";

import { CliCommand } from "./common.js";
import {
    AnalyzeReport,
    type IAnalyzeParams
} from "../../../../packages/node/src/reports/AnalyzeReport.js";
import { isValidDependencyType } from "../../../../packages/shared/src/reports/Validation.js";
import { defaultDependencyType } from "../../../../packages/node/src/common.js";

export class AnalyzeCommand extends CliCommand<AnalyzeReport> {
    public package = Option.String(`--package`, {
        description: `the package to analyze e.g. typescript, typescript@3.5.1`
    });

    public type = Option.String(`--type`, defaultDependencyType, {
        description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
    });

    public folder = Option.String(`--folder`, { description: `path to a package.json` });

    public full = Option.Boolean(`--full`, false, { description: `show all information` });

    static override readonly usage = Command.Usage({
        description: `analyze a npm package or a local project`,
        details: `
            This command will print information about a NPM package or about a local project.\n
            Defaults to dependencies, use the \`--type\` argument to specify devDependencies
        `,
        examples: [
            [`Analyze the latest version of a dependency`, `$0 analyze --package typescript`],
            [`Analyze a specific version of a dependency`, `$0 analyze --package typescript@3.5.1`],
            [
                `Analyze a projects devDependencies`,
                `$0 analyze --package typescript@3.5.1 --type=devDependencies`
            ],
            [`Analyze a local project`, `$0 analyze --folder /path/to/your/package.json`]
        ]
    });

    static override readonly paths = [[`analyze`]];

    getReports(): AnalyzeReport {
        if (!isValidDependencyType(this.type)) {
            throw new Error(
                `Please only specify "dependencies" or "devDependencies" for the --type argument\nReceived ${this.type}\n`
            );
        }

        if (this.folder) {
            const params: IAnalyzeParams = {
                folder: this.folder,
                full: this.full,
                type: this.type
            };

            return new AnalyzeReport(params);
        } else if (this.package) {
            const params: IAnalyzeParams = {
                package: this.package,
                full: this.full,
                type: this.type
            };

            return new AnalyzeReport(params);
        }

        throw new Error(`No package nor folder option was provided`);
    }
}
