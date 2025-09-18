import chalk from "chalk";
import { z } from "zod";

import { LoopUtilities } from "../extensions/utilities/LoopUtilities.js";
import { type IPackage } from "../../../shared/src/package/package.js";
import { getPackageVersionfromString } from "../../../shared/src/visitors/visitor.js";
import {
    AbstractReport,
    type IReportConfig,
    type IReportContext
} from "../../../shared/src/reports/Report.js";
import { BasePackageParameter, TypeParameter } from "../../../shared/src/reports/Validation.js";

const LoopParams = BasePackageParameter.merge(TypeParameter);

export type ILoopParams = z.infer<typeof LoopParams>;

export class LoopsReport extends AbstractReport<ILoopParams> {
    name = `Loop Report`;
    configs: IReportConfig;

    constructor(params: ILoopParams) {
        super(params);

        this.configs = {
            pkg: getPackageVersionfromString(params.package),
            type: params.type
        };
    }

    async report([pkg]: [IPackage], { stdoutFormatter }: IReportContext): Promise<void> {
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

    override validate(): z.ZodType<ILoopParams> {
        return LoopParams;
    }
}
