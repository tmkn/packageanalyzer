import { Command } from "clipanion";
import * as chalk from "chalk";

import { npmOnline } from "../providers/online";
import { getNameAndVersion } from "../npm";
import { Visitor } from "../visitors/visitor";
import { OraLogger } from "../logger";
import { defaultDependencyType, isValidDependencyType } from "./common";
import { IPackageVersionProvider } from "../providers/folder";

export class LoopsCommand extends Command {
    @Command.String(`--package`, {
        description: `the package to retrieve the loop info e.g. typescript@3.5.1`
    })
    public package?: string;

    @Command.String(`--type`, {
        description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
    })
    public type?: string = defaultDependencyType;

    static usage = Command.Usage({
        description: `show loops in the dependency tree`,
        details: `
            This command will show loops in the dependency tree.\n
            Defaults to dependencies, use the \`--type\` argument to specify devDependencies
        `,
        examples: [
            [
                `Show dependency loops for a NPM package for the latest version`,
                `$0 loops --package typescript`
            ],
            [
                `Show dependency loops for a NPM package for a specific version`,
                `$0 tree --package typescript@3.5.1`
            ],
            [
                `Show dependency loops for devDependencies`,
                `$0 tree --package typescript@3.5.1 --type=devDependencies`
            ]
        ]
    });

    static Provider: IPackageVersionProvider = npmOnline;

    @Command.Path(`loops`)
    async execute() {
        if (!isValidDependencyType(this.type)) {
            throw new Error(
                `Please only specify "dependencies" or "devDependencies" for the --type argument`
            );
        }

        if (typeof this.package !== "undefined") {
            const visitor = new Visitor(
                getNameAndVersion(this.package),
                LoopsCommand.Provider,
                new OraLogger()
            );
            const p = await visitor.visit(this.type);
            const loopPathMap = p.loopPathMap;
            const distinctCount: number = [...loopPathMap].reduce(
                (i, [, loops]) => i + loops.size,
                0
            );
            const loopPadding = ("" + distinctCount).length;
            let total = 0;

            this.context.stdout.write(
                chalk.bold(`${distinctCount} Loop(s) found for ${p.fullName}\n\n`)
            );
            if (distinctCount > 0) {
                this.context.stdout.write(`Affected Packages:\n`);
                for (const [pkgName, loopsForPkg] of loopPathMap) {
                    this.context.stdout.write(
                        `- ${`${loopsForPkg.size}x`.padStart(5)} ${pkgName}\n`
                    );
                }

                for (const [pkgName, loopsForPkg] of loopPathMap) {
                    this.context.stdout.write(
                        chalk.bgGray(`\n${loopsForPkg.size} Loop(s) found for ${pkgName}\n`)
                    );

                    let i = 0;
                    for (const loop of loopsForPkg) {
                        this.context.stdout.write(
                            `[${`${total + i++ + 1}`.padStart(
                                loopPadding
                            )}/${distinctCount}] ${loop}\n`
                        );
                    }

                    total += loopsForPkg.size;
                }
            }
        }
    }
}
