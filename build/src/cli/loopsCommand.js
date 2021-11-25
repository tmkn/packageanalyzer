"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoopsCommand = void 0;
const clipanion_1 = require("clipanion");
const common_1 = require("./common");
const LoopsReport_1 = require("../reports/LoopsReport");
const ReportService_1 = require("../reports/ReportService");
class LoopsCommand extends clipanion_1.Command {
    constructor() {
        super(...arguments);
        this.package = clipanion_1.Option.String(`--package`, {
            description: `the package to retrieve the loop info e.g. typescript@3.5.1`
        });
        this.type = clipanion_1.Option.String(`--type`, common_1.defaultDependencyType, {
            description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
        });
    }
    async execute() {
        if (!(0, common_1.isValidDependencyType)(this.type)) {
            throw new Error(`Please only specify "dependencies" or "devDependencies" for the --type argument`);
        }
        if (typeof this.package !== "undefined") {
            const params = {
                type: this.type,
                package: this.package
            };
            const loopsReport = new LoopsReport_1.LoopsReport(params);
            loopsReport.provider = LoopsCommand.PackageProvider;
            const reportService = new ReportService_1.ReportService({
                reports: [loopsReport]
            }, this.context.stdout, this.context.stderr);
            await reportService.process();
        }
    }
}
exports.LoopsCommand = LoopsCommand;
LoopsCommand.usage = clipanion_1.Command.Usage({
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
LoopsCommand.paths = [[`loops`]];
//# sourceMappingURL=loopsCommand.js.map