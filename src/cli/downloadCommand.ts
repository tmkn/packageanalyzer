import { Command, Option } from "clipanion";

import { DownloadReport, IDownloadParams } from "../reports/DownloadCountReport";
import { Url } from "../utils/requests";
import { CliCommand } from "./common";

export class DownloadCommand extends CliCommand<DownloadReport> {
    public package?: string = Option.String(`--package`, {
        description: `the package to retrieve the download count e.g. typescript@3.5.1`
    });

    static override usage = Command.Usage({
        description: `show the download count for a NPM package`,
        details: `
            This command will show show the download count for a NPM package.
        `,
        examples: [[`Show the download count for a NPM package`, `$0 loops --package typescript`]]
    });

    public static DownloadUrl?: Url;

    static override paths = [[`downloads`]];

    getReport(): DownloadReport {
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
