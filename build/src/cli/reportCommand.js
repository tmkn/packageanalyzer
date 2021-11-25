"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportCommand = void 0;
const path = require("path");
const clipanion_1 = require("clipanion");
const ReportService_1 = require("../reports/ReportService");
class ReportCommand extends clipanion_1.Command {
    constructor() {
        super(...arguments);
        this.config = clipanion_1.Option.String(`--config`, {
            required: true,
            description: `path to the config file`
        });
    }
    async execute() {
        const importPath = path.isAbsolute(this.config)
            ? this.config
            : path.join(process.cwd(), this.config);
        const config = require(importPath);
        const reportService = new ReportService_1.ReportService(config, this.context.stdout, this.context.stderr);
        await reportService.process();
    }
}
exports.ReportCommand = ReportCommand;
ReportCommand.usage = clipanion_1.Command.Usage({
    description: `run a series of checks defined in a config file`,
    details: `
            This command will run a series of checks defined in a config file
        `,
    examples: [[`Run a series of checks`, `$0 report --config ./path/to/config.js`]]
});
ReportCommand.paths = [[`report`]];
//# sourceMappingURL=reportCommand.js.map