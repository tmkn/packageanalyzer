import { Command, Option } from "clipanion";

import { npmOnline } from "../providers/online";
import { DependencyTypes } from "../visitors/visitor";
import { FileSystemPackageProvider } from "../providers/folder";
import { defaultDependencyType } from "./common";
import { ReportService } from "../reports/ReportService";
import { ITreeReportParams, TreeReport } from "../reports/TreeReport";

export class TreeCommand extends Command {
    public package?: string = Option.String(`--package`, {
        description: `the package to display the dependency tree e.g. typescript@3.5.1`
    });

    public type: DependencyTypes = Option.String(`--type`, defaultDependencyType, {
        description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
    });

    public folder?: string = Option.String(`--folder`, {
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
    async execute() {
        const params: ITreeReportParams = {
            type: this.type,
            folder: this.folder,
            package: this.package
        };
        const treeReport = new TreeReport(params);

        if (typeof this.package !== "undefined" && typeof this.folder !== "undefined") {
            this.context.stdout.write(`Please specify a package or folder.\n`);
        } else if (typeof this.package !== "undefined") {
            treeReport.provider = npmOnline;
        } else if (typeof this.folder !== "undefined") {
            treeReport.provider = new FileSystemPackageProvider(this.folder);
        }

        const reportService = new ReportService(
            {
                reports: [treeReport]
            },
            this.context.stdout,
            this.context.stderr
        );

        await reportService.process();
    }
}
