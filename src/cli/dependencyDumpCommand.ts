import { Command } from "clipanion";

import { getPackageVersionfromString } from "../visitors/visitor";
import { DependencyDumper } from "../utils/dumper";

export class DependencyDumperCommand extends Command {
    @Command.String(`--package`, {
        description: `the package to dump e.g. typescript, typescript@3.5.1`
    })
    public package?: string;

    @Command.String(`--folder`, {
        description: `folder to output the dump`
    })
    public folder?: string;

    @Command.String(`--registry`, {
        description: `online registry`
    })
    public registry: string = `http://registry.npmjs.com`;

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

            await dumper.collect(getPackageVersionfromString(this.package), this.registry);
            await dumper.save(this.folder);
        } catch (e) {
            this.context.stderr.write(`Something went wrong\n`);
            this.context.stderr.write(`${e}\n`);
        }
    }
}