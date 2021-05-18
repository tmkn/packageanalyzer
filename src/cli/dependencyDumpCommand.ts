import { Command } from "clipanion";

import { getPackageVersionfromString } from "../visitors/visitor";
import { DependencyDumper } from "../utils/dumper";

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
