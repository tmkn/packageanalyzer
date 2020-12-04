import { Command } from "clipanion";

import { npmOnline, OnlinePackageProvider } from "../providers/online";
import { PackageAnalytics } from "../analyzers/package";
import { getNameAndVersion } from "../npm";
import { IPackageVisitor, Visitor } from "../visitors/visitor";
import { FileSystemPackageProvider } from "../providers/folder";
import { getPackageJson } from "../visitors/folder";
import { OraLogger } from "../logger";
import { printStatistics, defaultDependencyType, isValidDependencyType } from "./common";

export class AnalyzeCommand extends Command {
    @Command.String(`--package`, {
        description: `the package to analyze e.g. typescript, typescript@3.5.1`
    })
    public package?: string;

    @Command.String(`--type`, {
        description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
    })
    public type?: string = defaultDependencyType;

    @Command.String(`--folder`, { description: `path to a package.json` })
    public folder?: string;

    @Command.Boolean(`--full`, { description: `show all information` })
    public full: boolean = false;

    static usage = Command.Usage({
        description: `analyze a npm package or a local project`,
        details: `
            This command will print information about a NPM package or about a local project.\n
            Defaults to dependencies, use the \`--type\` argument to specify devDependencies
        `,
        examples: [
            [`Analyze the latest version of a dependency`, `$0 analyze --package typescript`],
            [`Analyze a specific version of a dependency`, `$0 analyze --package typescript@3.5.1`],
            [
                `Analyze a projects devDependencies`,
                `$0 analyze --package typescript@3.5.1 --type=devDependencies`
            ],
            [`Analyze a local project`, `$0 analyze --folder /path/to/your/package.json`]
        ]
    });

    static OnlineProvider: OnlinePackageProvider = npmOnline;

    @Command.Path(`analyze`)
    async execute() {
        if (!isValidDependencyType(this.type)) {
            throw new Error(
                `Please only specify "dependencies" or "devDependencies" for the --type argument\nReceived ${this.type}\n`
            );
        }

        let visitor: IPackageVisitor | undefined = undefined;

        if (typeof this.package !== `undefined`) {
            visitor = new Visitor(
                getNameAndVersion(this.package),
                AnalyzeCommand.OnlineProvider,
                new OraLogger()
            );
        } else if (typeof this.folder !== `undefined`) {
            const provider = new FileSystemPackageProvider(this.folder);
            visitor = new Visitor(getPackageJson(this.folder), provider, new OraLogger());
        }

        if (typeof visitor === "undefined") {
            throw new Error(`Please specify a package or folder.\n`);
        }

        const pa: PackageAnalytics = await visitor.visit(this.type);

        printStatistics(pa, this.full);
    }
}
