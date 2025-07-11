import { Command, Option } from "clipanion";

import { type IUpdateInfoParams, UpdateInfoReport } from "../reports/UpdateInfoReport.js";
import { CliCommand } from "./common.js";

export class UpdateInfoCommand extends CliCommand<UpdateInfoReport> {
    public package?: string = Option.String(`--package`, {
        description: `the package to retrieve update info from e.g. typescript@3.5.1`
    });

    static override usage = Command.Usage({
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

    getReport(): UpdateInfoReport {
        if (typeof this.package === "undefined") throw new Error(`Please specify a package.`);

        const updateInfoParams: IUpdateInfoParams = {
            package: this.package
        };

        return new UpdateInfoReport(updateInfoParams);
    }

    static override paths = [[`update`]];
}
