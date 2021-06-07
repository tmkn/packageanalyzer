import { Command } from "clipanion";

import { DownloadReport, IDownloadParams } from "../reports/DownloadCountReport";
import { ReportService } from "../reports/ReportService";

export class DownloadCommand extends Command {
    @Command.String(`--package`, {
        description: `the package to retrieve the download count e.g. typescript@3.5.1`
    })
    public package?: string;

    static override usage = Command.Usage({
        description: `show the download count for a NPM package`,
        details: `
            This command will show show the download count for a NPM package.
        `,
        examples: [[`Show the download count for a NPM package`, `$0 loops --package typescript`]]
    });

    public static DownloadUrl?: string;

    @Command.Path(`downloads`)
    async execute() {
        if (typeof this.package !== "undefined") {
            const params: IDownloadParams = {
                pkg: this.package,
                url: DownloadCommand.DownloadUrl
            };
            const downloadReport = new DownloadReport(params);

            const reportService = new ReportService(
                {
                    reports: [downloadReport]
                },
                this.context.stdout
            );

            await reportService.process();
        }
    }
}
