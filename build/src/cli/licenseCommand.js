"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseCheckCommand = void 0;
const clipanion_1 = require("clipanion");
const LicenseReport_1 = require("../reports/LicenseReport");
const ReportService_1 = require("../reports/ReportService");
const common_1 = require("./common");
class LicenseCheckCommand extends clipanion_1.Command {
    constructor() {
        super(...arguments);
        this.package = clipanion_1.Option.String(`--package`, {
            description: `the package to analyze e.g. typescript, typescript@3.5.1`
        });
        this.type = clipanion_1.Option.String(`--type`, common_1.defaultDependencyType, {
            description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
        });
        this.allowList = clipanion_1.Option.Array(`--allow`, {
            description: `the type of dependencies you want to allow"`
        });
        this.grouped = clipanion_1.Option.Boolean(`--grouped`, false, {
            description: `specificies if the data should be grouped by license`
        });
        this.folder = clipanion_1.Option.String(`--folder`, { description: `path to a package.json` });
    }
    async execute() {
        if (!(0, common_1.isValidDependencyType)(this.type)) {
            throw new Error(`Please only specify "dependencies" or "devDependencies" for the --type argument`);
        }
        const params = {
            type: this.type,
            folder: this.folder,
            package: this.package,
            allowList: this.allowList,
            grouped: this.grouped
        };
        const licenseReport = new LicenseReport_1.LicenseReport(params);
        const reportService = new ReportService_1.ReportService({
            reports: [licenseReport]
        }, this.context.stdout, this.context.stderr);
        await reportService.process();
    }
}
exports.LicenseCheckCommand = LicenseCheckCommand;
LicenseCheckCommand.usage = clipanion_1.Command.Usage({
    description: `check the licenses for all packages in the dependency tree`,
    details: `
            This command will print license informations for all packages found in the dependency tree.\n
            Defaults to dependencies, use the \`--type\` argument to specify devDependencies
        `,
    examples: [
        [
            `Analyze licenses for the latest version of a dependency`,
            `$0 license --package typescript`
        ],
        [
            `Analyze licenses for a specific version of a dependency`,
            `$0 license --package typescript@3.5.1`
        ],
        [
            `Analyze a projects devDependencies licenses`,
            `$0 analyze --package typescript@3.5.1 --type=devDependencies`
        ],
        [
            `Analyze licenses for a local project`,
            `$0 analyze --folder /path/to/your/package.json`
        ],
        [
            `Analyze licenses and print the info grouped by license type`,
            `$0 license --package typescript@3.5.1 --grouped`
        ]
    ]
});
LicenseCheckCommand.paths = [[`license`]];
//# sourceMappingURL=licenseCommand.js.map