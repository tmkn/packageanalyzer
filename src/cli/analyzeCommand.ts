import { Command } from "clipanion";

import { npmOnline } from "../providers/online";
import { PackageAnalytics } from "../analyzers/package";
import { getNameAndVersion } from "../npm";
import { Visitor } from "../visitors/visitor";
import { FileSystemPackageProvider } from "../providers/folder";
import { getPackageJson } from "../visitors/folder";
import { OraLogger } from "../logger";
import { printStatistics } from "./common";

export class AnalyzeCommand extends Command {
    @Command.String(`--package`, {
        description: `the package to analyze e.g. typescript, typescript@3.5.1`
    })
    public package?: string;

    @Command.String(`--folder`, { description: `path to a package.json` })
    public folder?: string;

    static usage = Command.Usage({
        description: `analyze a npm package or a local project`,
        details: `
            This command will print information about a NPM package or about a local project.
        `,
        examples: [
            [`Analyze the latest version of a dependency`, `$0 analyze --package typescript`],
            [`Analyze a specific version of a dependency`, `$0 analyze --package typescript@3.5.1`],
            [`Analyze a local project`, `$0 analyze --folder /path/to/your/package.json`]
        ]
    });

    @Command.Path(`analyze`)
    async execute() {
        if (typeof this.package !== `undefined` && typeof this.folder !== `undefined`) {
            this.context.stdout.write(`Please specify a package or folder.\n`);
        } else if (typeof this.package !== `undefined`) {
            try {
                const visitor = new Visitor(
                    getNameAndVersion(this.package),
                    npmOnline,
                    new OraLogger()
                );
                const pa = await visitor.visit();

                printStatistics(pa);
            } catch (e) {
                console.log(e);
            }
        } else if (typeof this.folder !== `undefined`) {
            try {
                const provider = new FileSystemPackageProvider(this.folder);
                const visitor = new Visitor(getPackageJson(this.folder), provider, new OraLogger());
                const pa: PackageAnalytics = await visitor.visit();

                printStatistics(pa);
            } catch (e) {
                console.log(e);
            }
        }
    }
}
