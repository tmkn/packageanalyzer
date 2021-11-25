"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NpmDumpCommand = void 0;
const clipanion_1 = require("clipanion");
const flatFile_1 = require("../providers/flatFile");
const AnalyzeReport_1 = require("../reports/AnalyzeReport");
const ReportService_1 = require("../reports/ReportService");
class NpmDumpCommand extends clipanion_1.Command {
    constructor() {
        super(...arguments);
        this.npmFile = clipanion_1.Option.String(`--npmfile`, { description: `path to a npmdump.json` });
        this.package = clipanion_1.Option.String(`--package`, {
            description: `the package to analyze e.g. typescript, typescript@3.5.1`
        });
    }
    async execute() {
        if (typeof this.npmFile !== "undefined" && typeof this.package !== "undefined") {
            cliResolveFile(this.package, this.npmFile, this.context.stdout, this.context.stderr);
        }
    }
}
exports.NpmDumpCommand = NpmDumpCommand;
NpmDumpCommand.usage = clipanion_1.Command.Usage({
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
NpmDumpCommand.paths = [[`npmdump`]];
async function cliResolveFile(pkgName, npmFile, stdout, stderr) {
    try {
        const provider = new flatFile_1.FlatFileProvider(npmFile);
        const analyzeReport = new AnalyzeReport_1.AnalyzeReport({
            package: pkgName,
            full: false
        });
        analyzeReport.provider = provider;
        const reportService = new ReportService_1.ReportService({
            reports: [analyzeReport]
        }, stdout, stderr);
        await reportService.process();
    }
    catch (e) {
        stdout.write(e);
    }
}
//# sourceMappingURL=npmDumpCommand.js.map