import { Command } from "clipanion";
import * as chalk from "chalk";

import { npmOnline } from "../providers/online";
import { getNameAndVersion } from "../npm";
import { Visitor, DependencyTypes } from "../visitors/visitor";
import { OraLogger } from "../logger";
import { defaultDependencyType } from "./common";

export class LoopsCommand extends Command {
    @Command.String(`--package`, {
        description: `the package to retrieve the loop info e.g. typescript@3.5.1`
    })
    public package?: string;

    @Command.String(`--type`, {
        description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
    })
    public type?: DependencyTypes = defaultDependencyType;

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

    @Command.Path(`loops`)
    async execute() {
        if (this.type !== "dependencies" || this.type !== "dependencies") {
            throw new Error(
                `Please only specify "dependencies" or "devDependencies" for the --type argument`
            );
        }

        if (typeof this.package !== "undefined") {
            try {
                const visitor = new Visitor(
                    getNameAndVersion(this.package),
                    npmOnline,
                    new OraLogger()
                );
                const pa = await visitor.visit(this.type);
                const loopPathMap = pa.loopPathMap;
                const distinctCount: number = [...loopPathMap].reduce(
                    (i, [, loops]) => i + loops.size,
                    0
                );
                const loopPadding = ("" + distinctCount).length;
                let total = 0;

                console.log(chalk.bold(`${distinctCount} Loop(s) found for ${pa.fullName}\n`));
                if (distinctCount > 0) {
                    console.log(`Affected Packages:`);
                    for (const [pkgName, loopsForPkg] of loopPathMap) {
                        console.log(`- ${`${loopsForPkg.size}x`.padStart(5)} ${pkgName}`);
                    }

                    for (const [pkgName, loopsForPkg] of loopPathMap) {
                        console.log(
                            chalk.bgGray(`\n${loopsForPkg.size} Loop(s) found for ${pkgName}`)
                        );

                        let i = 0;
                        for (const loop of loopsForPkg) {
                            console.log(
                                `[${`${total + i++ + 1}`.padStart(
                                    loopPadding
                                )}/${distinctCount}] ${loop}`
                            );
                        }

                        total += loopsForPkg.size;
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }
    }
}
