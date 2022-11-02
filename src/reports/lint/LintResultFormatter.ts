import * as chalk from "chalk";

import { Package } from "../../package/package";
import { IFormatter } from "../../utils/formatter";
import { ILintTypes } from "./LintRule";

export interface ILintResult {
    type: ILintTypes;
    name: string;
    message: string;
    pkg: Package;
    rootPkg: string;
    path: string;
}

export interface ILintResultFormatter {
    formatter: IFormatter;
    format(results: ILintResult[]): void;
}

export class LintResultFormatter implements ILintResultFormatter {
    constructor(public formatter: IFormatter) {}

    format(results: ILintResult[]): void {
        let errorCount: number = 0;
        let warningCount: number = 0;
        let currentPackagePath: string | undefined = undefined;

        for (const { type, name, message, pkg, rootPkg, path } of results) {
            const severity = type === `error` ? chalk.red(type) : chalk.yellow(type);

            // Print the package path only once
            if (currentPackagePath !== path) {
                currentPackagePath = path;
                this.formatter.writeLine(`\n${chalk.cyan(path)}`);
            }

            this.formatter.writeLine(
                `  [${severity}][${chalk.cyan(pkg.fullName)}][${chalk.gray(name)}]: ${message}`
            );

            if (type === `error`) {
                errorCount++;
            } else if (type === `warning`) {
                warningCount++;
            }
        }

        if (results.length > 0) {
            this.formatter.writeLine(
                `\nFound ${chalk.yellow(`${warningCount} warning(s)`)} and ${chalk.red(
                    `${errorCount} error(s)`
                )}`
            );
        } else {
            this.formatter.writeLine(`\n${chalk.green(`Found no issues`)} (0 warnings, 0 errors)`);
        }
    }
}
