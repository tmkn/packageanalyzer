import { Command, Option } from "clipanion";

import { FlatFileProvider } from "../providers/flatFile";
import { Writable } from "stream";
import { AnalyzeReport } from "../reports/AnalyzeReport";
import { ReportService } from "../reports/ReportService";

export class NpmDumpCommand extends Command {
    public npmFile?: string = Option.String(`--npmfile`, { description: `path to a npmdump.json` });

    public package?: string = Option.String(`--package`, {
        description: `the package to analyze e.g. typescript, typescript@3.5.1`
    });

    static override usage = Command.Usage({
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

    static override paths = [[`npmdump`]];
    async execute() {
        if (typeof this.npmFile !== "undefined" && typeof this.package !== "undefined") {
            cliResolveFile(this.package, this.npmFile, this.context.stdout);
        }
    }
}

async function cliResolveFile(pkgName: string, npmFile: string, stdout: Writable): Promise<void> {
    try {
        const provider = new FlatFileProvider(npmFile);
        const analyzeReport = new AnalyzeReport({
            package: pkgName,
            full: false
        });

        analyzeReport.provider = provider;

        const reportService = new ReportService(
            {
                reports: [analyzeReport]
            },
            process.stdout
        );

        await reportService.process();
    } catch (e) {
        stdout.write(e);
    }
}
