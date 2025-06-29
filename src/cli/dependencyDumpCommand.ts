import { Command, Option } from "clipanion";

import { CliCommand } from "./common.js";
import { DependencyDumpReport } from "../reports/DependencyDumpReport.js";
import type { Url } from "../reports/Validation.js";

export class DependencyDumperCommand extends CliCommand<DependencyDumpReport> {
    public packages = Option.Array(`--package`, {
        required: true,
        description: `packages to collect (can contain version)`
    });

    public folder: string = Option.String(`--folder`, {
        required: true,
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
                `$0 dependencydump --package typescript --package react --folder /path/to/dump/folder`
            ]
        ]
    });

    static override paths = [[`dependencydump`]];

    getReport(): DependencyDumpReport {
        return new DependencyDumpReport({
            entries: this.packages,
            folder: this.folder,
            registry: this.registry
        });
    }
}
