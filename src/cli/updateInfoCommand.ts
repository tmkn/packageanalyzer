import { Command } from "clipanion";

import { npmOnline } from "../providers/online";
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

    @Command.Path(`update`)
    async execute() {
        if (typeof this.package === "undefined") {
            this.context.stdout.write(`Please specify a package.\n`);
        } else {
            try {
                const [name, version] = getNameAndVersion(this.package);

                if (typeof version === "undefined") {
                    console.log(`Version info is missing (${this.package})`);

                    return;
                }

                const data = await updateInfo(name, version, npmOnline);
                const padding = 24;

                console.log(`========= Update Info for ${this.package} =========`);
                console.log(
                    `Latest semantic match:`.padEnd(padding),
                    data.latestSemanticMatch.version,
                    daysAgo(data.latestSemanticMatch.releaseDate)
                );
                console.log(
                    `Latest bugfix:`.padEnd(padding),
                    data.latestBugfix.version,
                    daysAgo(data.latestBugfix.releaseDate)
                );
                console.log(
                    `Latest minor:`.padEnd(padding),
                    data.latestMinor.version,
                    daysAgo(data.latestMinor.releaseDate)
                );
                console.log(
                    `Latest version:`.padEnd(padding),
                    data.latestOverall.version,
                    daysAgo(data.latestOverall.releaseDate)
                );
            } catch (error) {
                console.log(`Couldn't get update info for ${this.package}`);
            }
        }
    }
}
