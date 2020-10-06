import { Command } from "clipanion";

import { npmOnline } from "../providers/online";
import { getNameAndVersion } from "../npm";
import { Visitor } from "../visitors/visitor";
import { OraLogger } from "../logger";

export class LoopsCommand extends Command {
    @Command.String(`--package`, {
        description: `the package to retrieve the loop info e.g. typescript@3.5.1`
    })
    public package?: string;

    static usage = Command.Usage({
        description: `show loops in the dependency tree`,
        details: `
            This command will show loops in the dependency tree.
        `,
        examples: [
            [
                `Show dependency loops for a NPM package for the latest version`,
                `$0 loops --package typescript`
            ],
            [
                `Show dependency loops for a NPM package for a specific version`,
                `$0 tree --package typescript@3.5.1`
            ]
        ]
    });

    @Command.Path(`loops`)
    async execute() {
        if (typeof this.package !== "undefined") {
            try {
                const visitor = new Visitor(
                    getNameAndVersion(this.package),
                    npmOnline,
                    new OraLogger()
                );
                const pa = await visitor.visit();
                const loopPathMap = pa.loopPathMap;
                const distinctCount: number = [...loopPathMap].reduce(
                    (i, [, loops]) => i + loops.size,
                    0
                );
                const loopPadding = ("" + distinctCount).length;
                let total = 0;

                console.log(`=== ${distinctCount} Loop(s) found for ${pa.fullName} ===\n`);
                if (distinctCount > 0) {
                    console.log(`Affected Packages:`);
                    for (const [pkgName, loopsForPkg] of loopPathMap) {
                        console.log(`- ${`${loopsForPkg.size}x`.padStart(5)} ${pkgName}`);
                    }

                    for (const [pkgName, loopsForPkg] of loopPathMap) {
                        console.log(`\n== ${loopsForPkg.size} Loop(s) found for ${pkgName} ==`);

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
