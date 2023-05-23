import * as chalk from "chalk";

import { Package } from "../../package/package";
import { IFormatter } from "../../utils/formatter";
import { ILintTypes } from "./LintRule";

export interface ILintResult {
    type: ILintTypes | "internal-error";
    name: string;
    message: string;
    pkg: Package;
    path: Array<[string, string]>;
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
        let internalErrorCount: number = 0;
        let currentPackagePath: string | undefined = undefined;

        for (const { type, name, message, pkg, path } of results) {
            const severity = this.#severityColor(type);
            //beautify path
            const packagePath: string = path
                .map(([name, version]) => `${name}@${version}`)
                .map(name => chalk.cyan(name))
                .join(chalk.white(` → `));

            // Print the package path only once
            if (currentPackagePath !== packagePath) {
                currentPackagePath = packagePath;
                this.formatter.writeLine(`\n${chalk.cyan(currentPackagePath)}`);
            }

            this.formatter.writeLine(
                `  [${severity}][${chalk.cyan(pkg.fullName)}][${chalk.gray(name)}]: ${message}`
            );

            if (type === `error`) {
                errorCount++;
            } else if (type === `warning`) {
                warningCount++;
            } else if (type === `internal-error`) {
                internalErrorCount++;
            }
        }

        if (results.length > 0) {
            const warningMsg = chalk.yellow(`${warningCount} warning(s)`);
            const errorMsg = chalk.red(`${errorCount} error(s)`);

            this.formatter.writeLine(`\nFound ${warningMsg} and ${errorMsg}`);
        } else {
            const noIssuesMsg = chalk.green(`Found no issues`);

            this.formatter.writeLine(`\n${noIssuesMsg} (0 warnings, 0 errors)`);
        }

        if (internalErrorCount > 0) {
            this.formatter.writeLine(
                chalk.bgRed(
                    `Terminated with ${internalErrorCount} internal error(s), please check lint output`
                )
            );
        }
    }

    #severityColor(type: ILintResult["type"]): string {
        switch (type) {
            case `error`:
                return chalk.red(type);
            case `warning`:
                return chalk.yellow(type);
            case `internal-error`:
                return chalk.bgRed(type);
        }
    }
}
