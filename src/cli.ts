#!/usr/bin/env node

import * as path from "path";
import * as fs from "fs";

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

let commandFound = false;

process.argv.forEach((arg, i) => {
    if (arg === "-v" && !commandFound) {
        console.log(`${getVersion()}`);
        commandFound = true;
    } else if (arg === "-h" && !commandFound) {
        showHelp();
        commandFound = true;
    } else if (arg === "-l" && !commandFound) {
        const folder = process.argv[i + 1];

        cliResolveFolder(folder);
        commandFound = true;
    } else if (arg === "-o" && !commandFound) {
        const name = process.argv[i + 1];

        cliResolveName(name);
        commandFound = true;
    } else if (arg === "-f") {
        const npmFile = process.argv[i + 1];
        const name = process.argv[i + 2];

        cliResolveFile(name, npmFile);
        commandFound = true;
    } else if (arg === "-lookup") {
        const file = process.argv[i + 1];
        const filePath = path.join(`tests`, `data`, `extractor`, `data.json`);

        cliCreateLookup(file ? file : filePath);
        commandFound = true;
    } else if (arg === "-downloads") {
        const pkg = process.argv[i + 1];

        cliDownloads(pkg);
        commandFound = true;
    } else if (arg === "-loops") {
        const pkg = process.argv[i + 1];

        cliLoops(pkg);
        commandFound = true;
    } else if (arg === "-u") {
        const name = process.argv[i + 1];

        cliUpdateInfo(name);
        commandFound = true;
    }
});

if (!commandFound) {
    console.log(`No command found`);
    showHelp();
}

function showHelp(): void {
    console.log(`Package Analyzer ${getVersion()}`);
    console.log(`Options:`);
    console.log(
        `${`-l`.padEnd(10)} ${`Analyze a local folder`.padEnd(60)} e.g. "pa -l path/to/project"`
    );
    console.log(
        `${`-o`.padEnd(10)} ${`Analyze a package, version optional, default latest`.padEnd(
            60
        )} e.g. "pa -o typescript(@3.5.1)"`
    );
    console.log(
        `${`-u`.padEnd(10)} ${`Get update info for a package`.padEnd(
            60
        )} e.g. "pa -u typescript@3.5.1"`
    );
    console.log(
        `${`-f`.padEnd(10)} ${`Analyze a package from a npm dump`.padEnd(
            60
        )} e.g. "pa -f path/to/npmdump typescript(@3.5.1)"`
    );
    console.log(
        `${`-lookup`.padEnd(10)} ${`Create a lookup file from a npm dump`.padEnd(
            60
        )} e.g. "pa -lookup path/to/npmdump"`
    );
    console.log(
        `${`-downloads`.padEnd(10)} ${`Get number of downloads from last week`.padEnd(
            60
        )} e.g. "pa -downloads typescript(@3.5.1)"`
    );
    console.log(
        `${`-loops`.padEnd(10)} ${`Show dependency loops`.padEnd(
            60
        )} e.g. "pa -loops typescript(@3.5.1)"`
    );
    console.log(`${`-v`.padEnd(10)} ${`Prints version`.padEnd(60)}`);
    console.log(`${`-h`.padEnd(10)} ${`Display help`.padEnd(60)}`);
}

async function cliDownloads(pkg: string): Promise<void> {
    try {
        const downloads = await getDownloadsLastWeek(pkg);

        console.log(`${pkg}: ${downloads.downloads} Downloads`);
    } catch {
        console.log(`Couldn't get downloads for ${pkg}`);
    }
}

async function cliCreateLookup(file: string): Promise<void> {
    await createLookupFile(file);
}

async function cliResolveFolder(folder: string | undefined): Promise<void> {
    if (typeof folder === "undefined") {
        console.log(`Missing folder path\n`);
        showHelp();

        return;
    }

    try {
        const provider = new FileSystemPackageProvider(folder);
        const visitor = new Visitor(getPackageJson(folder), provider, new OraLogger());
        const pa: PackageAnalytics = await visitor.visit();

        printStatistics(pa);
    } catch (e) {
        console.log(e);
    }
}

async function cliLoops(pkgString: string | undefined): Promise<void> {
    if (typeof pkgString === "undefined") {
        console.log(`Missing package name\n`);
        showHelp();

        return;
    }

    try {
        const visitor = new Visitor(getNameAndVersion(pkgString), npmOnline, new OraLogger());
        const pa = await visitor.visit();
        const loopPathMap = pa.loopPathMap;
        const distinctCount: number = [...loopPathMap].reduce((i, [, loops]) => i + loops.size, 0);
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
                        `[${`${total + i++ + 1}`.padStart(loopPadding)}/${distinctCount}] ${loop}`
                    );
                }

                total += loopsForPkg.size;
            }
        }
    } catch (e) {
        console.log(e);
    }
}

async function cliResolveName(pkgName: string | undefined): Promise<void> {
    if (typeof pkgName === "undefined") {
        console.log(`Missing package name\n`);
        showHelp();

        return;
    }

    try {
        const visitor = new Visitor(getNameAndVersion(pkgName), npmOnline, new OraLogger());
        const pa = await visitor.visit();

        printStatistics(pa);
    } catch (e) {
        console.log(e);
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

async function cliUpdateInfo(token: string): Promise<void> {
    try {
        const [name, version] = getNameAndVersion(token);

        if (typeof version === "undefined") {
            console.log(`Version info is missing (${token})`);

            return;
        }

        const data = await updateInfo(name, version, npmOnline);
        const padding = 24;

        console.log(`========= Update Info for ${token} =========`);
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
        console.log(`Couldn't get update info for ${token}`);
    }
}

function getVersion(): string {
    try {
        const file = path.join(__dirname, "./../../package.json");

        return JSON.parse(fs.readFileSync(file, "utf8")).version;
    } catch (e) {
        return "version parse error!";
    }
}
