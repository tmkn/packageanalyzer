"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadCommand = void 0;
const clipanion_1 = require("clipanion");
const DownloadCountReport_1 = require("../reports/DownloadCountReport");
const ReportService_1 = require("../reports/ReportService");
class DownloadCommand extends clipanion_1.Command {
    constructor() {
        super(...arguments);
        this.package = clipanion_1.Option.String(`--package`, {
            description: `the package to retrieve the download count e.g. typescript@3.5.1`
        });
    }
    async execute() {
        if (typeof this.package !== "undefined") {
            const params = {
                pkg: this.package,
                url: DownloadCommand.DownloadUrl
            };
            const downloadReport = new DownloadCountReport_1.DownloadReport(params);
            downloadReport.provider = DownloadCommand.PackageProvider;
            const reportService = new ReportService_1.ReportService({
                reports: [downloadReport]
            }, this.context.stdout, this.context.stderr);
            await reportService.process();
        }
    }
}
exports.DownloadCommand = DownloadCommand;
DownloadCommand.usage = clipanion_1.Command.Usage({
    description: `show the download count for a NPM package`,
    details: `
            This command will show show the download count for a NPM package.
        `,
    examples: [[`Show the download count for a NPM package`, `$0 loops --package typescript`]]
});
DownloadCommand.paths = [[`downloads`]];
//# sourceMappingURL=downloadCommand.js.map