"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateInfoReport = void 0;
const chalk = require("chalk");
const common_1 = require("../cli/common");
const update_1 = require("../utils/update");
const utils_1 = require("../visitors/utils");
const Report_1 = require("./Report");
class UpdateInfoReport extends Report_1.AbstractReport {
    constructor(params) {
        super();
        this.params = params;
        this.name = `Update Info Report`;
        this.depth = 0;
        this.pkg = (0, utils_1.getPackageVersionfromString)(params.package);
        this.provider = params.provider;
    }
    async report(pkg, { stdoutFormatter }) {
        const [name, version] = this.pkg;
        if (typeof version === "undefined") {
            stdoutFormatter.writeLine(`Version info is missing (${name})`);
            return;
        }
        const data = await (0, update_1.updateInfo)(name, version, this.params.provider);
        const updateStr = chalk.bold(`Update Info for ${pkg.fullName}`);
        stdoutFormatter.writeLine(`${updateStr}\n`);
        stdoutFormatter.writeGroup([
            [
                `Semantic match`,
                `${data.latestSemanticMatch.version}  ${(0, common_1.daysAgo)(data.latestSemanticMatch.releaseDate)}`
            ],
            [
                `Latest bugfix`,
                `${data.latestBugfix.version} ${(0, common_1.daysAgo)(data.latestBugfix.releaseDate)}`
            ],
            [
                `Latest minor`,
                `${data.latestMinor.version} ${(0, common_1.daysAgo)(data.latestMinor.releaseDate)}`
            ],
            [
                `Latest version`,
                `${data.latestOverall.version} ${(0, common_1.daysAgo)(data.latestOverall.releaseDate)}`
            ]
        ]);
    }
}
exports.UpdateInfoReport = UpdateInfoReport;
//# sourceMappingURL=UpdateInfoReport.js.map