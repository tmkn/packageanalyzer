import * as fs from "fs";

import { Command } from "clipanion";

import { npmOnline, OnlinePackageProvider } from "../providers/online";
import { Package } from "../analyzers/package";
import { getNameAndVersion } from "../npm";
import { Visitor, DependencyTypes } from "../visitors/visitor";
import { FileSystemPackageProvider } from "../providers/folder";
import { getPackageJson } from "../visitors/folder";
import { OraLogger } from "../logger";
import { defaultDependencyType } from "./common";
import { Formatter } from "../formatter";
import { printDependencyTree } from "../extensions/statistics/LoopStatistics";

export class TreeCommand extends Command {
    @Command.String(`--package`, {
        description: `the package to display the dependency tree e.g. typescript@3.5.1`
    })
    public package?: string;

    @Command.String(`--type`, {
        description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
    })
    public type?: DependencyTypes = defaultDependencyType;

    @Command.String(`--folder`, {
        description: `path to a package.json`
    })
    public folder?: string;

    static usage = Command.Usage({
        description: `show the dependency tree of a NPM package or a local project`,
        details: `
            This command will print the dependency tree of a NPM package or a local project.\n
            Defaults to dependencies, use the \`--type\` argument to specify devDependencies
        `,
        examples: [
            [
                `Show the dependency tree for a NPM package for the latest version`,
                `$0 tree --package typescript`
            ],
            [
                `Show the dependency tree for a NPM package for a specific version`,
                `$0 tree --package typescript@3.5.1`
            ],
            [
                `Show the dependency tree for devDependencies`,
                `$0 tree --package typescript@3.5.1 --type=devDependencies`
            ],
            [
                `Show the dependency tree for a local folder`,
                `$0 analyze --folder ./path/to/your/package.json`
            ]
        ]
    });

    static OnlineProvider: OnlinePackageProvider = npmOnline;

    @Command.Path(`tree`)
    async execute() {
        const formatter = new Formatter(this.context.stdout);

        if (typeof this.package !== "undefined" && typeof this.folder !== "undefined") {
            this.context.stdout.write(`Please specify a package or folder.\n`);
        } else if (typeof this.package !== "undefined") {
            const visitor = new Visitor(
                getNameAndVersion(this.package),
                TreeCommand.OnlineProvider,
                new OraLogger()
            );
            const p = await visitor.visit(this.type);

            printDependencyTree(p, formatter);
        } else if (typeof this.folder !== "undefined") {
            if (fs.existsSync(this.folder)) {
                const provider = new FileSystemPackageProvider(this.folder);
                const visitor = new Visitor(getPackageJson(this.folder), provider, new OraLogger());
                const p: Package = await visitor.visit(this.type);

                printDependencyTree(p, formatter);
            }
        }
    }
}
