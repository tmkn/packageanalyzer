import { Cli, Builtins } from "clipanion";

import { AnalyzeCommand } from "./analyzeCommand";
import { UpdateInfoCommand } from "./updateInfoCommand";
import { DownloadCommand } from "./downloadCommand";
import { LoopsCommand } from "./loopsCommand";
import { TreeCommand } from "./treeCommand";
import { NpmDumpCommand } from "./npmDumpCommand";
import { getVersion } from "./common";
import { NpmDumpLookupCreatorCommand } from "./npmLookupCreatorCommand";
import { LicenseCheckCommand } from "./licenseCommand";
import { ReportCommand } from "./reportCommand";
import { DependencyDumperCommand } from "./dependencyDumpCommand";

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