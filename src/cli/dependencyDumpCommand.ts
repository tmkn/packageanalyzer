import { Command, Option } from "clipanion";

import { getPackageVersionfromString } from "../visitors/visitor";
import { DependencyDumper } from "../utils/dumper";
import { Url } from "../utils/requests";

export class DependencyDumperCommand extends Command {
    public packages = Option.Array(`--packages`, {
        description: `packages to collect (can contain version)`
    });

    public folder?: string = Option.String(`--folder`, {
        description: `folder to output the dump`
    });

    public registry: Url = Option.String(`--registry`, `https://registry.npmjs.com`, {
        description: `online registry`
    });

    static override usage = Command.Usage({
        category: `Developer Tools`,
        description: `looks up package(s) from an online registry and dumps the package.json`,
        details: `
            This command will look up a package from an online registry and dump the package.json and all of the dependencies package.json.
        `,
        examples: [
            [
                `Lookup latest package details from a NPM dump`,
                `$0 dependencydump --packages typescript --packages react --folder /path/to/dump/folder`
            ]
        ]
    });

    static override paths = [[`dependencydump`]];
    async execute() {
        try {
            if (!this.packages || !this.folder) {
                this.context.stderr.write(`--packages or --folder argument missing\n`);

                return;
            }
            const entries = this.packages.map(pkg => getPackageVersionfromString(pkg));
            const dumper = new DependencyDumper();

            await dumper.collect(entries, this.registry);
            await dumper.save(this.folder);
        } catch (e) {
            this.context.stderr.write(`Something went wrong\n`);
            this.context.stderr.write(`${e}\n`);
        }
    }
}
