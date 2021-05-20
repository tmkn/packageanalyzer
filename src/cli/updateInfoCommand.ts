import { Command } from "clipanion";

import { npmOnline } from "../providers/online";
import { Formatter } from "../utils/formatter";
import { IUpdateInfoParams, UpdateInfoReport } from "../reports/UpdateInfoReport";
import { ReportService } from "../reports/ReportService";

export class UpdateInfoCommand extends Command {
    @Command.String(`--package`, {
        description: `the package to retrieve update info from e.g. typescript@3.5.1`
    })
    public package?: string;

    static usage = Command.Usage({
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

    @Command.Path(`update`)
    async execute() {
        const formatter = new Formatter(this.context.stdout);

        if (typeof this.package === "undefined") {
            formatter.writeLine(`Please specify a package.`);
        } else {
            const updateInfoParams: IUpdateInfoParams = {
                package: this.package,
                provider: npmOnline
            };
            const updateInfoReport = new UpdateInfoReport(updateInfoParams);

            const reportService = new ReportService(
                {
                    reports: [updateInfoReport]
                },
                this.context.stdout
            );

            await reportService.process();
        }
    }
}
