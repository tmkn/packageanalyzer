import { Command } from "clipanion";

import { getPackageVersionfromString, Visitor } from "../visitors/visitor";
import { OraLogger } from "../utils/logger";
import { FlatFileProvider } from "../providers/flatFile";
import { printStatistics } from "./common";
import { Writable } from "stream";
import { IFormatter, Formatter } from "../utils/formatter";
import { AnalyzeReport } from "../reports/AnalyzeReport";
import { ReportService } from "../reports/ReportService";

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
