import { Command, Option } from "clipanion";

import { CliCommand, defaultDependencyType, isValidDependencyType } from "./common";
import { AnalyzeReport, IAnalyzeParams } from "../reports/AnalyzeReport";

export class AnalyzeCommand extends CliCommand<AnalyzeReport> {
    public package?: string = Option.String(`--package`, {
        description: `the package to analyze e.g. typescript, typescript@3.5.1`
    });

    public type?: string = Option.String(`--type`, defaultDependencyType, {
        description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
    });

    public folder?: string = Option.String(`--folder`, { description: `path to a package.json` });

    public full: boolean = Option.Boolean(`--full`, false, { description: `show all information` });

    static override usage = Command.Usage({
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

    static override paths = [[`analyze`]];

    createReport(): AnalyzeReport {
        if (!isValidDependencyType(this.type)) {
            throw new Error(
                `Please only specify "dependencies" or "devDependencies" for the --type argument\nReceived ${this.type}\n`
            );
        }

        const params: IAnalyzeParams = {
            folder: this.folder,
            package: this.package,
            type: this.type,
            full: this.full
        };

        const analyzeReport = new AnalyzeReport(params);

        return analyzeReport;
    }
}
