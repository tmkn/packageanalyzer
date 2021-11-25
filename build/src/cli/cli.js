"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cli = void 0;
const clipanion_1 = require("clipanion");
const analyzeCommand_1 = require("./analyzeCommand");
const updateInfoCommand_1 = require("./updateInfoCommand");
const downloadCommand_1 = require("./downloadCommand");
const loopsCommand_1 = require("./loopsCommand");
const treeCommand_1 = require("./treeCommand");
const npmDumpCommand_1 = require("./npmDumpCommand");
const common_1 = require("./common");
const npmLookupCreatorCommand_1 = require("./npmLookupCreatorCommand");
const licenseCommand_1 = require("./licenseCommand");
const reportCommand_1 = require("./reportCommand");
const dependencyDumpCommand_1 = require("./dependencyDumpCommand");
exports.cli = new clipanion_1.Cli({
    binaryLabel: `packageanalyzer`,
    binaryName: `pkga`,
    binaryVersion: (0, common_1.getVersion)()
});
//standard commands
exports.cli.register(reportCommand_1.ReportCommand);
exports.cli.register(analyzeCommand_1.AnalyzeCommand);
exports.cli.register(updateInfoCommand_1.UpdateInfoCommand);
exports.cli.register(downloadCommand_1.DownloadCommand);
exports.cli.register(loopsCommand_1.LoopsCommand);
exports.cli.register(treeCommand_1.TreeCommand);
exports.cli.register(licenseCommand_1.LicenseCheckCommand);
//development niche commands
exports.cli.register(npmDumpCommand_1.NpmDumpCommand);
exports.cli.register(npmLookupCreatorCommand_1.NpmDumpLookupCreatorCommand);
exports.cli.register(dependencyDumpCommand_1.DependencyDumperCommand);
//built in commands
exports.cli.register(clipanion_1.Builtins.HelpCommand);
exports.cli.register(clipanion_1.Builtins.VersionCommand);
//# sourceMappingURL=cli.js.map