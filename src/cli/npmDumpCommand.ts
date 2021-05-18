import { Command } from "clipanion";

import { getPackageVersionfromString, Visitor } from "../visitors/visitor";
import { OraLogger } from "../utils/logger";
import { FlatFileProvider } from "../providers/flatFile";
import { printStatistics } from "./common";
import { Writable } from "stream";
import { IFormatter, Formatter } from "../utils/formatter";
import { DependencyDumper } from "../../tests/common";

export class NpmDumpCommand extends Command {
    @Command.String(`--npmfile`, { description: `path to a npmdump.json` })
    public npmFile?: string;

    @Command.String(`--package`, {
        description: `the package to analyze e.g. typescript, typescript@3.5.1`
    })
    public package?: string;

    static usage = Command.Usage({
        category: `Developer Tools`,
        description: `looks up a package from a NPM dump`,
        details: `
            This command will look up a package from a NPM dump.
        `,
        examples: [
            [
                `Lookup latest package details from a NPM dump`,
                `$0 npmdump --package typescript --npmfile /path/to/your/npmfile.json`
            ],
            [
                `Lookup package details for a specific version from a NPM dump`,
                `$0 npmdump --package typescript@3.5.1 --npmfile /path/to/your/npmfile.json`
            ]
        ]
    });

    @Command.Path(`npmdump`)
    async execute() {
        if (typeof this.npmFile !== "undefined" && typeof this.package !== "undefined") {
            cliResolveFile(this.package, this.npmFile, this.context.stdout);
        }
    }
}

async function cliResolveFile(pkgName: string, npmFile: string, stdout: Writable): Promise<void> {
    try {
        const formatter: IFormatter = new Formatter(stdout);
        const provider = new FlatFileProvider(npmFile);
        const visitor = new Visitor(
            getPackageVersionfromString(pkgName),
            provider,
            new OraLogger()
        );
        const p = await visitor.visit();

        await printStatistics(p, false, formatter);
    } catch (e) {
        stdout.write(e);
    }
}

export class DependencyDumperCommand extends Command {
    @Command.String(`--package`, {
        description: `the package to analyze e.g. typescript, typescript@3.5.1`
    })
    public package?: string;

    @Command.String(`--folder`, {
        description: `folder to output the dump`
    })
    public folder?: string;

    static usage = Command.Usage({
        category: `Developer Tools`,
        description: `looks up a package from an online registry and dumps the package.json`,
        details: `
            This command will look up a package from an online registry and dump the package.json and all of the dependencies package.json.
        `,
        examples: [
            [
                `Lookup latest package details from a NPM dump`,
                `$0 dependencydump --package typescript --folder /path/to/dump/folder`
            ]
        ]
    });

    @Command.Path(`dependencydump`)
    async execute() {
        try {
            if (!this.package || !this.folder) {
                this.context.stderr.write(`--package or --folder argument missing\n`);

                return;
            }

            const dumper = new DependencyDumper();

            await dumper.collect(
                getPackageVersionfromString(this.package),
                `http://registry.npmjs.com`
            );
            await dumper.save(this.folder);
        } catch (e) {
            console.log(`Something went wrong`);
            console.log(e);
        }
    }
}
