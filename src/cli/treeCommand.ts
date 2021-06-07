import { Command } from "clipanion";

import { npmOnline } from "../providers/online";
import { DependencyTypes } from "../visitors/visitor";
import { FileSystemPackageProvider } from "../providers/folder";
import { defaultDependencyType } from "./common";
import { ReportService } from "../reports/ReportService";
import { ITreeReportParams, TreeReport } from "../reports/TreeReport";

export class TreeCommand extends Command {
    @Command.String(`--package`, {
        description: `the package to display the dependency tree e.g. typescript@3.5.1`
    })
    public package?: string;

    @Command.String(`--type`, {
        description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
    })
    public type?: DependencyTypes = defaultDependencyType;

    @Command.String(`--folder`, {
        description: `path to a package.json`
    })
    public folder?: string;

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

    @Command.Path(`tree`)
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
            this.context.stdout
        );

        await reportService.process();
    }
}
