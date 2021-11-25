"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoopsReport = void 0;
const chalk = require("chalk");
const common_1 = require("../cli/common");
const LoopUtilities_1 = require("../extensions/utilities/LoopUtilities");
const utils_1 = require("../visitors/utils");
const Report_1 = require("./Report");
class LoopsReport extends Report_1.AbstractReport {
    constructor(params) {
        super();
        this.params = params;
        this.name = `Loop Report`;
        this.pkg = (0, utils_1.getPackageVersionfromString)(params.package);
        this.type = params.type;
    }
    async report(pkg, { stdoutFormatter }) {
        if (!(0, common_1.isValidDependencyType)(this.type)) {
            throw new Error(`Please only specify "dependencies" or "devDependencies" for the --type argument`);
        }
        const loopPathMap = new LoopUtilities_1.LoopUtilities(pkg).loopPathMap;
        const distinctCount = [...loopPathMap].reduce((i, [, loops]) => i + loops.size, 0);
        const loopPadding = ("" + distinctCount).length;
        let total = 0;
        stdoutFormatter.writeLine(chalk.bold(`${distinctCount} Loop(s) found for ${pkg.fullName}\n`));
        if (distinctCount > 0) {
            stdoutFormatter.writeLine(`Affected Packages:`);
            for (const [pkgName, loopsForPkg] of loopPathMap) {
                const loopCountStr = `${loopsForPkg.size}x`.padStart(5);
                stdoutFormatter.writeLine(`- ${loopCountStr} ${pkgName}`);
            }
            for (const [pkgName, loopsForPkg] of loopPathMap) {
                stdoutFormatter.writeLine(chalk.bgGray(`\n${loopsForPkg.size} Loop(s) found for ${pkgName}`));
                let i = 0;
                for (const loop of loopsForPkg) {
                    const iStr = `${total + i++ + 1}`.padStart(loopPadding);
                    stdoutFormatter.writeLine(`[${iStr}/${distinctCount}] ${loop}`);
                }
                total += loopsForPkg.size;
            }
        }
    }
}
exports.LoopsReport = LoopsReport;
//# sourceMappingURL=LoopsReport.js.map