import * as chalk from "chalk";

import { isValidDependencyType } from "../cli/common";
import { LoopUtilities } from "../extensions/utilities/LoopUtilities";
import { Package } from "../package/package";
import { getPackageVersionfromString, PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";
import { DependencyTypes } from "./Validation";

export interface ILoopParams {
    package: string;
    type: DependencyTypes;
}

export class LoopsReport extends AbstractReport<ILoopParams> {
    name = `Loop Report`;
    pkg: PackageVersion;

    constructor(override readonly params: ILoopParams) {
        super(params);

        this.pkg = getPackageVersionfromString(params.package);
        this.type = params.type;
    }

    async report(pkg: Package, { stdoutFormatter }: IReportContext): Promise<void> {
        if (!isValidDependencyType(this.type)) {
            throw new Error(
                `Please only specify "dependencies" or "devDependencies" for the --type argument`
            );
        }

        const loopPathMap = new LoopUtilities(pkg).loopPathMap;
        const distinctCount: number = [...loopPathMap].reduce((i, [, loops]) => i + loops.size, 0);
        const loopPadding = ("" + distinctCount).length;
        let total = 0;

        stdoutFormatter.writeLine(
            chalk.bold(`${distinctCount} Loop(s) found for ${pkg.fullName}\n`)
        );
        if (distinctCount > 0) {
            stdoutFormatter.writeLine(`Affected Packages:`);
            for (const [pkgName, loopsForPkg] of loopPathMap) {
                const loopCountStr = `${loopsForPkg.size}x`.padStart(5);

                stdoutFormatter.writeLine(`- ${loopCountStr} ${pkgName}`);
            }

            for (const [pkgName, loopsForPkg] of loopPathMap) {
                stdoutFormatter.writeLine(
                    chalk.bgGray(`\n${loopsForPkg.size} Loop(s) found for ${pkgName}`)
                );

                let i = 0;
                for (const loop of loopsForPkg) {
                    const iStr = `${total + i++ + 1}`.padStart(loopPadding);

                    stdoutFormatter.writeLine(`[${iStr}/${distinctCount}] ${loop}`);
                }

                total += loopsForPkg.size;
            }
        }
    }

    validate = undefined;
}
