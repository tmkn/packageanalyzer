"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateInfoCommand = void 0;
const clipanion_1 = require("clipanion");
const online_1 = require("../providers/online");
const formatter_1 = require("../utils/formatter");
const UpdateInfoReport_1 = require("../reports/UpdateInfoReport");
const ReportService_1 = require("../reports/ReportService");
class UpdateInfoCommand extends clipanion_1.Command {
    constructor() {
        super(...arguments);
        this.package = clipanion_1.Option.String(`--package`, {
            description: `the package to retrieve update info from e.g. typescript@3.5.1`
        });
    }
    async execute() {
        const formatter = new formatter_1.Formatter(this.context.stdout);
        if (typeof this.package === "undefined") {
            formatter.writeLine(`Please specify a package.`);
        }
        else {
            const updateInfoParams = {
                package: this.package,
                provider: online_1.npmOnline
            };
            const updateInfoReport = new UpdateInfoReport_1.UpdateInfoReport(updateInfoParams);
            const reportService = new ReportService_1.ReportService({
                reports: [updateInfoReport]
            }, this.context.stdout, this.context.stderr);
            await reportService.process();
        }
    }
}
exports.UpdateInfoCommand = UpdateInfoCommand;
UpdateInfoCommand.usage = clipanion_1.Command.Usage({
    description: `gets update info from a npm package`,
    details: `
            This command will print update information about a NPM package.
        `,
    examples: [
        [
            `Get update info for a specific version of a dependency`,
            `$0 update --package typescript@3.5.1`
        ]
    ]
});
UpdateInfoCommand.paths = [[`update`]];
//# sourceMappingURL=updateInfoCommand.js.map