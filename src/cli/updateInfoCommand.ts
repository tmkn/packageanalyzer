import { Command } from "clipanion";
import * as chalk from "chalk";

import { npmOnline, OnlinePackageProvider } from "../providers/online";
import { getNameAndVersion } from "../npm";
import { updateInfo } from "../analyzers/update";
import { daysAgo } from "./common";

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
        if (typeof this.package === "undefined") {
            this.context.stdout.write(`Please specify a package.\n`);
        } else {
            const [name, version] = getNameAndVersion(this.package);

            if (typeof version === "undefined") {
                this.context.stdout.write(`Version info is missing (${this.package})\n`);

                return;
            }

            const data = await updateInfo(name, version, UpdateInfoCommand.OnlineProvider);
            const padding = 16;

            this.context.stdout.write(`${chalk.bold(`Update Info for ${this.package}\n`)}\n`);
            this.context.stdout.write(`
                ${`Semantic match:`.padEnd(padding)} 
                ${data.latestSemanticMatch.version} 
                ${daysAgo(data.latestSemanticMatch.releaseDate)}
            \n`);
            this.context.stdout.write(`
                ${`Latest bugfix:`.padEnd(padding)} 
                ${data.latestBugfix.version} 
                ${daysAgo(data.latestBugfix.releaseDate)}
            \n`);
            console.log(`
                ${`Latest minor:`.padEnd(padding)} 
                ${data.latestMinor.version} 
                ${daysAgo(data.latestMinor.releaseDate)}
            \n`);
            console.log(`
                ${`Latest version:`.padEnd(padding)} 
                ${data.latestOverall.version} 
                ${daysAgo(data.latestOverall.releaseDate)}
            \n`);
        }
    }
}
