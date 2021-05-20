import * as chalk from "chalk";

import { isValidDependencyType } from "../cli/common";
import { LoopMetrics } from "../extensions/metrics/LoopMetrics";
import { Package } from "../package/package";
import { IFormatter } from "../utils/formatter";
import { DependencyTypes, getPackageVersionfromString, PackageVersion } from "../visitors/visitor";
import { IReport } from "./Report";

export interface ILoopParams {
    package: string;
    type: DependencyTypes;
}
export class LoopsReport implements IReport<ILoopParams> {
    name = `Loop Report`;
    pkg: PackageVersion;
    type: DependencyTypes;

    constructor(readonly params: ILoopParams) {
        this.pkg = getPackageVersionfromString(params.package);
        this.type = params.type;
    }

    async report(pkg: Package, formatter: IFormatter): Promise<void> {
        if (!isValidDependencyType(this.type)) {
            throw new Error(
                `Please only specify "dependencies" or "devDependencies" for the --type argument`
            );
        }

        const loopPathMap = new LoopMetrics(pkg).loopPathMap;
        const distinctCount: number = [...loopPathMap].reduce((i, [, loops]) => i + loops.size, 0);
        const loopPadding = ("" + distinctCount).length;
        let total = 0;

        formatter.writeLine(chalk.bold(`${distinctCount} Loop(s) found for ${pkg.fullName}\n`));
        if (distinctCount > 0) {
            formatter.writeLine(`Affected Packages:`);
            for (const [pkgName, loopsForPkg] of loopPathMap) {
                const loopCountStr = `${loopsForPkg.size}x`.padStart(5);

                formatter.writeLine(`- ${loopCountStr} ${pkgName}`);
            }

            for (const [pkgName, loopsForPkg] of loopPathMap) {
                formatter.writeLine(
                    chalk.bgGray(`\n${loopsForPkg.size} Loop(s) found for ${pkgName}`)
                );

                let i = 0;
                for (const loop of loopsForPkg) {
                    const iStr = `${total + i++ + 1}`.padStart(loopPadding);

                    formatter.writeLine(`[${iStr}/${distinctCount}] ${loop}`);
                }

                total += loopsForPkg.size;
            }
        }
    }
}
