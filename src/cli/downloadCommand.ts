import { Command } from "clipanion";

import { getDownloadsLastWeek } from "../npm";

export class DownloadCommand extends Command {
    @Command.String(`--package`, {
        description: `the package to retrieve the download count e.g. typescript@3.5.1`
    })
    public package?: string;

    static usage = Command.Usage({
        description: `show the download count for a NPM package`,
        details: `
            This command will show show the download count for a NPM package.
        `,
        examples: [[`Show the download count for a NPM package`, `$0 loops --package typescript`]]
    });

    @Command.Path(`downloads`)
    async execute() {
        if (typeof this.package !== "undefined") {
            cliDownloads(this.package);
        }
    }
}

async function cliDownloads(pkg: string): Promise<void> {
    try {
        const downloads = await getDownloadsLastWeek(pkg);

        console.log(`${pkg}: ${downloads.downloads} Downloads`);
    } catch {
        console.log(`Couldn't get downloads for ${pkg}`);
    }
}
