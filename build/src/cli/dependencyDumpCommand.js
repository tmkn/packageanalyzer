"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyDumperCommand = void 0;
const clipanion_1 = require("clipanion");
const dumper_1 = require("../utils/dumper");
const utils_1 = require("../visitors/utils");
class DependencyDumperCommand extends clipanion_1.Command {
    constructor() {
        super(...arguments);
        this.package = clipanion_1.Option.String(`--package`, {
            description: `the package to dump e.g. typescript, typescript@3.5.1`
        });
        this.folder = clipanion_1.Option.String(`--folder`, {
            description: `folder to output the dump`
        });
        this.registry = clipanion_1.Option.String(`--registry`, `https://registry.npmjs.com`, {
            description: `online registry`
        });
    }
    async execute() {
        try {
            if (!this.package || !this.folder) {
                this.context.stderr.write(`--package or --folder argument missing\n`);
                return;
            }
            const dumper = new dumper_1.DependencyDumper();
            await dumper.collect((0, utils_1.getPackageVersionfromString)(this.package), this.registry);
            await dumper.save(this.folder);
        }
        catch (e) {
            this.context.stderr.write(`Something went wrong\n`);
            this.context.stderr.write(`${e}\n`);
        }
    }
}
exports.DependencyDumperCommand = DependencyDumperCommand;
DependencyDumperCommand.usage = clipanion_1.Command.Usage({
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
DependencyDumperCommand.paths = [[`dependencydump`]];
//# sourceMappingURL=dependencyDumpCommand.js.map