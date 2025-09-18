import { Cli, Builtins } from "clipanion";

import { AnalyzeCommand } from "./analyzeCommand.js";
import { UpdateInfoCommand } from "./updateInfoCommand.js";
import { DownloadCommand } from "./downloadCommand.js";
import { LoopsCommand } from "./loopsCommand.js";
import { TreeCommand } from "./treeCommand.js";
import { LicenseCheckCommand } from "./licenseCommand.js";
import { ReportCommand } from "./reportCommand.js";
import { DependencyDumperCommand } from "./dependencyDumpCommand.js";
import { TestCommand } from "./testCommand.js";
import { DiffCommand } from "./diffCommand.js";
import { LintCommand } from "./lintCommand.js";
import { getVersion } from "../../../../packages/node/src/common.js";

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
cli.register(DiffCommand);
cli.register(LintCommand);

//development niche commands
cli.register(DependencyDumperCommand);

cli.register(TestCommand);

//built in commands
cli.register(Builtins.HelpCommand);
cli.register(Builtins.VersionCommand);
