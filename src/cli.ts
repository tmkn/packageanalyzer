#!/usr/bin/env node

import { Cli, Builtins } from "clipanion";

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
import { DependencyDumperCommand } from "./cli/dependencyDumpCommand";

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
cli.register(DependencyDumperCommand);

//built in commands
cli.register(Builtins.HelpCommand);
cli.register(Builtins.VersionCommand);

if (require.main === module) {
    cli.runExit(process.argv.slice(2), {
        ...Cli.defaultContext
    });
}
