#!/usr/bin/env node

import * as path from "path";
import * as fs from "fs";

import { Cli, Command } from "clipanion";
import * as dayjs from "dayjs";

import { npmOnline } from "./providers/online";
import { PackageAnalytics, VersionSummary, GroupedLicenseSummary } from "./analyzers/package";
import { getNameAndVersion, getDownloadsLastWeek } from "./npm";
import { Visitor } from "./visitors/visitor";
import { FileSystemPackageProvider } from "./providers/folder";
import { getPackageJson } from "./visitors/folder";
import { OraLogger } from "./logger";
import { FlatFileProvider } from "./providers/flatFile";
import { createLookupFile } from "./lookup";
import { updateInfo } from "./analyzers/update";

function getVersion(): string {
    try {
        const file = path.join(__dirname, "./../../package.json");

        return JSON.parse(fs.readFileSync(file, "utf8")).version;
    } catch (e) {
        return "version parse error!";
    }
}

function printStatistics(pa: PackageAnalytics): void {
    const padding = 40;
    const paddingLeft = 4;

    console.log(`=== Statistics for ${pa.fullName} ===\n`);

    printPublished(pa, padding);
    printOldest(pa.oldest, padding);
    printNewest(pa.newest, padding);
    console.log(`${`Direct dependencies:`.padEnd(padding)}${pa.directDependencyCount}`);
    console.log(`${`Transitive dependencies:`.padEnd(padding)}${pa.transitiveDependenciesCount}`);
    printDistinctDependencies(pa.distinctByNameCount, pa.distinctByVersionCount, paddingLeft);
    printMostReferred(pa.mostReferred, padding);
    printMostDependencies(pa.mostDependencies, padding);
    printMostVersion(pa.mostVersions, padding, paddingLeft);
    printLoops(pa, padding, paddingLeft);
    printLicenseInfo(pa.licensesByGroup, paddingLeft);
}

function printNewest(newest: PackageAnalytics | undefined, padding: number): void {
    if (newest && newest.published) {
        console.log(
            `${`Newest package:`.padEnd(padding)}${
                newest.fullName
            } - ${newest.published.toUTCString()} ${daysAgo(newest.published)}`
        );
        console.log(`${`Newest package path:`.padEnd(padding)}${newest.pathString}`);
    }
}

function printOldest(oldest: PackageAnalytics | undefined, padding: number): void {
    if (oldest && oldest.published) {
        console.log(
            `${`Oldest package:`.padEnd(padding)}${
                oldest.fullName
            } - ${oldest.published.toUTCString()} ${daysAgo(oldest.published)}`
        );
        console.log(`${`Oldest package path:`.padEnd(padding)}${oldest.pathString}`);
    }
}

function daysAgo(date: string | number | Date): string {
    return `(${dayjs(new Date()).diff(date, "day")} days ago)`;
}

function printPublished(pa: PackageAnalytics, padding: number): void {
    if (!pa.published) return;

    console.log(
        `${`Published:`.padEnd(padding)}${pa.published.toUTCString()} ${daysAgo(pa.published)}`
    );
}

function printDistinctDependencies(
    byName: number,
    byNameAndVersion: number,
    paddingLeft: number
): void {
    console.log(`Distinct dependencies:`);
    console.log(`${``.padStart(paddingLeft)}${byName}: distinct name`);
    console.log(`${``.padStart(paddingLeft)}${byNameAndVersion}: distinct name and version`);
}

function printLoops(pa: PackageAnalytics, padding: number, paddingLeft: number): void {
    const { loops, loopPathMap, distinctLoopCount } = pa;

    console.log(`${`Loops:`.padEnd(padding)}${loops.length} (${distinctLoopCount} distinct)`);

    if (distinctLoopCount > 0) {
        const [first] = loops.map(l => l.pathString).sort();

        console.log(`    affected Packages: [${[...loopPathMap.keys()].join(", ")}]`);
        console.log(`    e.g. ${first}`);

        if (loops.length > 1)
            console.log(`${``.padStart(paddingLeft)}+${loops.length - 1} additional loops`);
    }
}

function printMostDependencies(pa: PackageAnalytics, padding: number): void {
    console.log(
        `${`Most direct dependencies:`.padEnd(padding)}"${pa.name}": ${pa.directDependencyCount}`
    );
}

function printMostReferred(arg: [string, number], padding: number): void {
    console.log(`${`Most referred package:`.padEnd(padding)}"${arg[0]}": ${arg[1]}x`);
}

function printMostVersion(mostVerions: VersionSummary, padding: number, paddingLeft: number): void {
    console.log(`${`Package(s) with most versions:`.padEnd(padding)}`);

    for (const [name, versions] of mostVerions) {
        console.log(`${``.padStart(paddingLeft)}${name} [${[...versions].join(", ")}]`);
    }
}

function printLicenseInfo(groupedLicenses: GroupedLicenseSummary, paddingLeft: number): void {
    console.log(`Licenses:`);
    for (const { license, names } of groupedLicenses) {
        const threshold = 4;
        const samples: string[] = names.slice(0, threshold);

        if (names.length >= threshold)
            console.log(
                `${``.padStart(paddingLeft)}${license} - [${samples.join(", ")}, +${
                    names.length - threshold
                } more]`
            );
        else console.log(`${``.padStart(paddingLeft)}${license} - [${samples.join(", ")}]`);
    }
}

async function cliResolveFile(pkgName: string, npmFile: string): Promise<void> {
    try {
        const provider = new FlatFileProvider(npmFile);
        const visitor = new Visitor(getNameAndVersion(pkgName), provider, new OraLogger());
        const pa = await visitor.visit();

        printStatistics(pa);
    } catch (e) {
        console.log(e);
    }
}

async function cliDownloads(pkg: string): Promise<void> {
    try {
        const downloads = await getDownloadsLastWeek(pkg);

        console.log(`${pkg}: ${downloads.downloads} Downloads`);
    } catch {
        console.log(`Couldn't get downloads for ${pkg}`);
    }
}

const cli = new Cli({
    binaryLabel: `packageanalyzer`,
    binaryName: `pkga`,
    binaryVersion: getVersion()
});

class UpdateInfoCommand extends Command {
    @Command.String(`--package`, {
        description: `the package to retrieve update info from e.g. typescript@3.5.1`
    })
    public package?: string;

    static usage = Command.Usage({
        description: `gets update info from a npm package`,
        details: `
            This command will print update information about a NPM package.
        `,
        examples: [
            [
                `Get update info for a specific version of a dependency`,
                `$0 update --package typescript@3.5.1`
            ]
        ]
    });

    @Command.Path(`update`)
    async execute() {
        if (typeof this.package === "undefined") {
            this.context.stdout.write(`Please specify a package.\n`);
        } else {
            try {
                const [name, version] = getNameAndVersion(this.package);

                if (typeof version === "undefined") {
                    console.log(`Version info is missing (${this.package})`);

                    return;
                }

                const data = await updateInfo(name, version, npmOnline);
                const padding = 24;

                console.log(`========= Update Info for ${this.package} =========`);
                console.log(
                    `Latest semantic match:`.padEnd(padding),
                    data.latestSemanticMatch.version,
                    daysAgo(data.latestSemanticMatch.releaseDate)
                );
                console.log(
                    `Latest bugfix:`.padEnd(padding),
                    data.latestBugfix.version,
                    daysAgo(data.latestBugfix.releaseDate)
                );
                console.log(
                    `Latest minor:`.padEnd(padding),
                    data.latestMinor.version,
                    daysAgo(data.latestMinor.releaseDate)
                );
                console.log(
                    `Latest version:`.padEnd(padding),
                    data.latestOverall.version,
                    daysAgo(data.latestOverall.releaseDate)
                );
            } catch (error) {
                console.log(`Couldn't get update info for ${this.package}`);
            }
        }
    }
}

class DownloadCommand extends Command {
    @Command.String(`--package`, {
        description: `the package to retrieve the download count e.g. typescript@3.5.1`
    })
    public package?: string;

    static usage = Command.Usage({
        description: `show the download count for a NPM package`,
        details: `
            This command will show show the download count for a NPM package.
        `,
        examples: [[`Show the download count for a NPM package`, `$0 loops --package typescript`]]
    });

    @Command.Path(`downloads`)
    async execute() {
        if (typeof this.package !== "undefined") {
            cliDownloads(this.package);
        }
    }
}

class LoopsCommand extends Command {
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

class TreeCommand extends Command {
    @Command.String(`--package`, {
        description: `the package to display the dependency tree e.g. typescript@3.5.1`
    })
    public package?: string;

    @Command.String(`--folder`, {
        description: `path to a package.json`
    })
    public folder?: string;

    static usage = Command.Usage({
        description: `show the dependency tree of a NPM package or a local project`,
        details: `
            This command will print the dependency tree of a NPM package or a local project.
        `,
        examples: [
            [
                `Show the dependency tree for a NPM package for the latest version`,
                `$0 tree --package typescript`
            ],
            [
                `Show the dependency tree for a NPM package for a specific version`,
                `$0 tree --package typescript@3.5.1`
            ],
            [
                `Show the dependency tree for a local folder`,
                `$0 analyze --folder ./path/to/your/package.json`
            ]
        ]
    });

    @Command.Path(`tree`)
    async execute() {
        if (typeof this.package !== "undefined" && typeof this.folder !== "undefined") {
            this.context.stdout.write(`Please specify a package or folder.\n`);
        } else if (typeof this.package !== "undefined") {
            try {
                const visitor = new Visitor(
                    getNameAndVersion(this.package),
                    npmOnline,
                    new OraLogger()
                );
                const pa = await visitor.visit();

                pa.printDependencyTree();
            } catch (e) {
                console.log(e);
            }
        } else if (typeof this.folder !== "undefined") {
            try {
                if (fs.existsSync(this.folder)) {
                    const provider = new FileSystemPackageProvider(this.folder);
                    const visitor = new Visitor(
                        getPackageJson(this.folder),
                        provider,
                        new OraLogger()
                    );
                    const pa: PackageAnalytics = await visitor.visit();

                    pa.printDependencyTree();
                }
            } catch (e) {
                console.log(e);
            }
        }
    }
}

class AnalyzeCommand extends Command {
    @Command.String(`--package`, {
        description: `the package to analyze e.g. typescript, typescript@3.5.1`
    })
    public package?: string;

    @Command.String(`--folder`, { description: `path to a package.json` })
    public folder?: string;

    static usage = Command.Usage({
        description: `analyze a npm package or a local project`,
        details: `
            This command will print information about a NPM package or about a local project.
        `,
        examples: [
            [`Analyze the latest version of a dependency`, `$0 analyze --package typescript`],
            [`Analyze a specific version of a dependency`, `$0 analyze --package typescript@3.5.1`],
            [`Analyze a local project`, `$0 analyze --folder /path/to/your/package.json`]
        ]
    });

    @Command.Path(`analyze`)
    async execute() {
        if (typeof this.package !== `undefined` && typeof this.folder !== `undefined`) {
            this.context.stdout.write(`Please specify a package or folder.\n`);
        } else if (typeof this.package !== `undefined`) {
            try {
                const visitor = new Visitor(
                    getNameAndVersion(this.package),
                    npmOnline,
                    new OraLogger()
                );
                const pa = await visitor.visit();

                printStatistics(pa);
            } catch (e) {
                console.log(e);
            }
        } else if (typeof this.folder !== `undefined`) {
            try {
                const provider = new FileSystemPackageProvider(this.folder);
                const visitor = new Visitor(getPackageJson(this.folder), provider, new OraLogger());
                const pa: PackageAnalytics = await visitor.visit();

                printStatistics(pa);
            } catch (e) {
                console.log(e);
            }
        }
    }
}

class NpmDumpCommand extends Command {
    @Command.String(`--npmfile`, { description: `path to a npmdump.json` })
    public npmFile?: string;

    @Command.String(`--package`, {
        description: `the package to analyze e.g. typescript, typescript@3.5.1`
    })
    public package?: string;

    static usage = Command.Usage({
        category: `Developer Tools`,
        description: `looks up a package from a NPM dump`,
        details: `
            This command will look up a package from a NPM dump.
        `,
        examples: [
            [
                `Lookup latest package details from a NPM dump`,
                `$0 npmdump --package typescript --npmfile /path/to/your/npmfile.json`
            ],
            [
                `Lookup package details for a specific version from a NPM dump`,
                `$0 npmdump --package typescript@3.5.1 --npmfile /path/to/your/npmfile.json`
            ]
        ]
    });

    @Command.Path(`npmdump`)
    async execute() {
        if (typeof this.npmFile !== "undefined" && typeof this.package !== "undefined") {
            cliResolveFile(this.package, this.npmFile);
        }
    }
}

class NpmDumpLookupCreatorCommand extends Command {
    @Command.String(`--npmfile`, { description: `path to a npmdump.json` })
    public npmFile?: string;

    static usage = Command.Usage({
        category: `Developer Tools`,
        description: `creates a lookup file from a NPM dump`,
        details: `
            This command will create a lookup file from a NPM dump.
        `,
        examples: [
            [
                `Create a lookup file from a NPM dump`,
                `$0 lookupfile --npmfile /path/to/your/npmfile.json`
            ]
        ]
    });

    @Command.Path(`lookupfile`)
    async execute() {
        if (typeof this.npmFile !== "undefined") {
            await createLookupFile(this.npmFile);
        }
    }
}

//standard commands
cli.register(AnalyzeCommand);
cli.register(UpdateInfoCommand);
cli.register(DownloadCommand);
cli.register(LoopsCommand);
cli.register(TreeCommand);

//development niche commands
cli.register(NpmDumpCommand);
cli.register(NpmDumpLookupCreatorCommand);

//built in commands
cli.register(Command.Entries.Help);
cli.register(Command.Entries.Version);

cli.runExit(process.argv.slice(2), {
    ...Cli.defaultContext
});
