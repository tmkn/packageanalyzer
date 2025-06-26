import { Command, Option } from "clipanion";

import { type ILintServiceConfig, LintService } from "../reports/lint/LintService.js";
import { LintFileLoader } from "../reports/lint/RulesLoader.js";
import { getPackageVersionfromString } from "../visitors/visitor.js";
import { npmOnline } from "../providers/online.js";
import { FileSystemPackageProvider } from "../providers/folder.js";
import { Formatter, type IFormatter } from "../utils/formatter.js";
import { getPackageVersionFromPath } from "../visitors/util.node.js";

export class LintCommand extends Command {
    public lintFile = Option.String();

    public depth = Option.String(`--depth`, "no_valid_number", {
        description: `how deep to analyze the dependency tree`
    });

    public package = Option.String(`--package`, {
        description: `the package to analyze e.g. typescript, typescript@3.5.1`
    });

    public folder = Option.String(`--folder`, { description: `path to a package.json` });

    static override usage = Command.Usage({
        description: `lint your dependency tree`,
        details: `
            This command will lint your dependency tree and print out the results
        `,
        examples: [
            [
                `Lint a local project`,
                `$0 lint --folder /path/to/your/package.json /path/to/lintconfig.js`
            ],
            [`Lint a dependency`, `$0 lint --package package /path/to/lintconfig.js`],
            [
                `Lint a specific version of a dependency`,
                `$0 lint --package package@version /path/to/lintconfig.js`
            ]
        ]
    });

    static override paths = [[`lint`]];

    async execute() {
        try {
            const config = this.#getConfig();
            this.beforeProcess?.(config);
            const lintService = new LintService(config, this.context.stdout, this.context.stderr);

            return lintService.process();
        } catch (e: any) {
            const stderrFormatter: IFormatter = new Formatter(this.context.stderr);

            stderrFormatter.writeLine(e?.toString());
            console.error(e?.toString());

            return 1;
        }
    }

    #getConfig(): ILintServiceConfig {
        let depth = parseInt(this.depth, 10);

        if (isNaN(depth)) {
            depth = Infinity;
        }

        if (this.package) {
            return {
                entry: getPackageVersionfromString(this.package),
                loader: new LintFileLoader(this.lintFile),
                depth,
                provider: npmOnline
            };
        } else if (this.folder) {
            return {
                entry: getPackageVersionFromPath(this.folder),
                loader: new LintFileLoader(this.lintFile),
                depth,
                provider: new FileSystemPackageProvider(this.folder)
            };
        } else {
            throw new Error(`No package nor folder option was provided`);
        }
    }

    beforeProcess: ((config: ILintServiceConfig) => void) | undefined = undefined;
}
