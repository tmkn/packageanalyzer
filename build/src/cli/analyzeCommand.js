"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzeCommand = void 0;
const clipanion_1 = require("clipanion");
const common_1 = require("./common");
const AnalyzeReport_1 = require("../reports/AnalyzeReport");
const ReportService_1 = require("../reports/ReportService");
class AnalyzeCommand extends clipanion_1.Command {
    constructor() {
        super(...arguments);
        this.package = clipanion_1.Option.String(`--package`, {
            description: `the package to analyze e.g. typescript, typescript@3.5.1`
        });
        this.type = clipanion_1.Option.String(`--type`, common_1.defaultDependencyType, {
            description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
        });
        this.folder = clipanion_1.Option.String(`--folder`, { description: `path to a package.json` });
        this.full = clipanion_1.Option.Boolean(`--full`, false, { description: `show all information` });
    }
    async execute() {
        if (!(0, common_1.isValidDependencyType)(this.type)) {
            throw new Error(`Please only specify "dependencies" or "devDependencies" for the --type argument\nReceived ${this.type}\n`);
        }
        const params = {
            folder: this.folder,
            package: this.package,
            type: this.type,
            full: this.full
        };
        const analyzeReport = new AnalyzeReport_1.AnalyzeReport(params);
        const reportService = new ReportService_1.ReportService({
            reports: [analyzeReport]
        }, this.context.stdout, this.context.stderr);
        await reportService.process();
    }
}
exports.AnalyzeCommand = AnalyzeCommand;
AnalyzeCommand.usage = clipanion_1.Command.Usage({
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
AnalyzeCommand.paths = [[`analyze`]];
//# sourceMappingURL=analyzeCommand.js.map