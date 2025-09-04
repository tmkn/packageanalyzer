import { Command, Option } from "clipanion";

import { DownloadReport, type IDownloadParams } from "../reports/DownloadCountReport.js";
import type { Url } from "../reports/Validation.js";
import { CliCommand } from "./common.js";

export class DownloadCommand extends CliCommand<DownloadReport> {
    public package?: string = Option.String(`--package`, {
        description: `the package to retrieve the download count e.g. typescript@3.5.1`
    });

    static override readonly usage = Command.Usage({
        description: `show the download count for a NPM package`,
        details: `
            This command will show show the download count for a NPM package.
        `,
        examples: [[`Show the download count for a NPM package`, `$0 loops --package typescript`]]
    });

    public static DownloadUrl?: Url;

    static override readonly paths = [[`downloads`]];

    getReports(): DownloadReport {
        if (typeof this.package !== "undefined") {
            const params: IDownloadParams = {
                package: this.package,
                url: DownloadCommand.DownloadUrl
            };

            return new DownloadReport(params);
        }

        throw new Error(`--package was undefined`);
    }
}
