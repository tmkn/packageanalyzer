import { Command } from "clipanion";
import { Formatter, IFormatter } from "../utils/formatter";

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

    static DownloadUrl: string | null = null;

    @Command.Path(`downloads`)
    async execute() {
        if (typeof this.package !== "undefined") {
            const formatter = new Formatter(this.context.stdout);

            cliDownloads(this.package, DownloadCommand.DownloadUrl, formatter);
        }
    }
}

async function cliDownloads(pkg: string, url: string | null, formmater: IFormatter): Promise<void> {
    try {
        const downloads =
            url !== null ? await getDownloadsLastWeek(pkg, url) : await getDownloadsLastWeek(pkg);

        formmater.writeLine(`${pkg}: ${downloads.downloads} Downloads`);
    } catch {
        formmater.writeLine(`Couldn't get downloads for ${pkg}`);
    }
}
