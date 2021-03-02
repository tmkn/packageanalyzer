import { Command } from "clipanion";
import * as chalk from "chalk";

import { npmOnline, OnlinePackageProvider } from "../providers/online";
import { updateInfo } from "../utils/update";
import { daysAgo } from "./common";
import { Formatter } from "../utils/formatter";
import { getNameAndVersion } from "../visitors/visitor";

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

    static OnlineProvider: OnlinePackageProvider = npmOnline;

    @Command.Path(`update`)
    async execute() {
        const formatter = new Formatter(this.context.stdout);

        if (typeof this.package === "undefined") {
            formatter.writeLine(`Please specify a package.`);
        } else {
            const [name, version] = getNameAndVersion(this.package);

            if (typeof version === "undefined") {
                formatter.writeLine(`Version info is missing (${this.package})`);

                return;
            }

            const data = await updateInfo(name, version, UpdateInfoCommand.OnlineProvider);

            formatter.writeLine(`${chalk.bold(`Update Info for ${this.package}`)}\n`);
            formatter.writeGroup([
                [
                    `Semantic match`,
                    `${data.latestSemanticMatch.version}  ${daysAgo(
                        data.latestSemanticMatch.releaseDate
                    )}`
                ],
                [
                    `Latest bugfix`,
                    `${data.latestBugfix.version} ${daysAgo(data.latestBugfix.releaseDate)}`
                ],
                [
                    `Latest minor`,
                    `${data.latestMinor.version} ${daysAgo(data.latestMinor.releaseDate)}`
                ],
                [
                    `Latest version`,
                    `${data.latestOverall.version} ${daysAgo(data.latestOverall.releaseDate)}`
                ]
            ]);
        }
    }
}
