#!/usr/bin/env node

import { Cli, Command } from "clipanion";

import { AnalyzeCommand } from "./cli/analyzeCommand";
import { UpdateInfoCommand } from "./cli/updateInfoCommand";
import { DownloadCommand } from "./cli/downloadCommand";
import { LoopsCommand } from "./cli/loopsCommand";
import { TreeCommand } from "./cli/treeCommand";
import { NpmDumpCommand } from "./cli/npmDumpCommand";
import { getVersion } from "./cli/common";
import { NpmDumpLookupCreatorCommand } from "./cli/npmLookupCreatorCommand";
import { LicenseCheckCommand } from "./cli/licenseCommand";
import { ReportCommand } from "./cli/reportCommand";

export const cli = new Cli({
    binaryLabel: `packageanalyzer`,
    binaryName: `pkga`,
    binaryVersion: getVersion()
});

//standard commands
cli.register(ReportCommand);
cli.register(AnalyzeCommand);
cli.register(UpdateInfoCommand);
cli.register(DownloadCommand);
cli.register(LoopsCommand);
cli.register(TreeCommand);
cli.register(LicenseCheckCommand);

//development niche commands
cli.register(NpmDumpCommand);
cli.register(NpmDumpLookupCreatorCommand);

//built in commands
cli.register(Command.Entries.Help);
cli.register(Command.Entries.Version);

if (require.main === module) {
    cli.runExit(process.argv.slice(2), {
        ...Cli.defaultContext
    });
}
