import { Command, Option } from "clipanion";
import { z } from "zod";

import { LintReport, LintReportParams } from "../reports/LintReport";
import { CliCommand } from "./common";

export type IAnalyzeParams = z.infer<typeof LintReportParams>;

export class LintCommand extends CliCommand<LintReport> {
    public lintFile = Option.String();

    public depth = Option.Counter(`--depth`, Infinity, {
        description: `how deep to analyze the dependency tree`
    });

    public package = Option.String(`--package`, {
        description: `the package to analyze e.g. typescript, typescript@3.5.1`
    });

    public folder = Option.String(`--folder`, { description: `path to a package.json` });

    static override usage = Command.Usage({
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

    static override paths = [[`lint`]];

    getReport(): LintReport {
        if (this.folder) {
            const params: IAnalyzeParams = {
                folder: this.folder,
                depth: this.depth,
                lintFile: this.lintFile
            };

            return new LintReport(params);
        } else if (this.package) {
            const params: IAnalyzeParams = {
                package: this.package,
                depth: this.depth,
                lintFile: this.lintFile
            };

            return new LintReport(params);
        }

        throw new Error(`No package nor folder option was provided`);
    }
}
