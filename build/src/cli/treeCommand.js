"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeCommand = void 0;
const clipanion_1 = require("clipanion");
const online_1 = require("../providers/online");
const folder_1 = require("../providers/folder");
const common_1 = require("./common");
const ReportService_1 = require("../reports/ReportService");
const TreeReport_1 = require("../reports/TreeReport");
class TreeCommand extends clipanion_1.Command {
    constructor() {
        super(...arguments);
        this.package = clipanion_1.Option.String(`--package`, {
            description: `the package to display the dependency tree e.g. typescript@3.5.1`
        });
        this.type = clipanion_1.Option.String(`--type`, common_1.defaultDependencyType, {
            description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
        });
        this.folder = clipanion_1.Option.String(`--folder`, {
            description: `path to a package.json`
        });
    }
    async execute() {
        const params = {
            type: this.type,
            folder: this.folder,
            package: this.package
        };
        const treeReport = new TreeReport_1.TreeReport(params);
        if (typeof this.package !== "undefined" && typeof this.folder !== "undefined") {
            this.context.stdout.write(`Please specify a package or folder.\n`);
        }
        else if (typeof this.package !== "undefined") {
            treeReport.provider = online_1.npmOnline;
        }
        else if (typeof this.folder !== "undefined") {
            treeReport.provider = new folder_1.FileSystemPackageProvider(this.folder);
        }
        const reportService = new ReportService_1.ReportService({
            reports: [treeReport]
        }, this.context.stdout, this.context.stderr);
        await reportService.process();
    }
}
exports.TreeCommand = TreeCommand;
TreeCommand.usage = clipanion_1.Command.Usage({
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
TreeCommand.paths = [[`tree`]];
//# sourceMappingURL=treeCommand.js.map