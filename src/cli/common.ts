import * as path from "path";
import * as fs from "fs";

import * as dayjs from "dayjs";
import * as chalk from "chalk";

import { PackageAnalytics, VersionSummary, GroupedLicenseSummary } from "../analyzers/package";
import { DependencyTypes } from "../visitors/visitor";

export const defaultDependencyType: DependencyTypes = "dependencies";

export function isValidDependencyType(type: unknown): type is DependencyTypes {
    if (typeof type === "string" && (type === "dependencies" || type === "devDependencies"))
        return true;

    return false;
}

export function getVersion(): string {
    try {
        const file = path.join(__dirname, "./../../../package.json");

        return JSON.parse(fs.readFileSync(file, "utf8")).version;
    } catch (e) {
        return "version parse error!";
    }
}

export function daysAgo(date: string | number | Date): string {
    return `(${dayjs(new Date()).diff(date, "day")} days ago)`;
}

export function printStatistics(pa: PackageAnalytics, extra: boolean): void {
    console.log(`Statistics for ${chalk.bold(pa.fullName)}\n`);

    extra ? printExhaustiveStatistics(pa) : printCondensedStatistics(pa);
}

const Padding = 40;
const PaddingLeft = 4;

export function printExhaustiveStatistics(pa: PackageAnalytics): void {
    printPublished(pa, Padding);
    printOldest(pa.oldest, Padding);
    printNewest(pa.newest, Padding);
    console.log(`${`Direct dependencies:`.padEnd(Padding)}${pa.directDependencyCount}`);
    console.log(`${`Transitive dependencies:`.padEnd(Padding)}${pa.transitiveDependenciesCount}`);
    printDistinctDependencies(pa.distinctByNameCount, pa.distinctByVersionCount, PaddingLeft);
    printMostReferred(pa.mostReferred, Padding);
    printMostDependencies(pa.mostDependencies, Padding);
    printMostVersion(pa.mostVersions, Padding, PaddingLeft);
    printLoops(pa, Padding, PaddingLeft);
    printLicenseInfo(pa.licensesByGroup, PaddingLeft);
}

export function printCondensedStatistics(pa: PackageAnalytics): void {
    console.log(`${`Direct dependencies:`.padEnd(Padding)}${pa.directDependencyCount}`);
    console.log(`${`Transitive dependencies:`.padEnd(Padding)}${pa.transitiveDependenciesCount}`);
    printSimpleDistinctDependencies(pa.distinctByNameCount, Padding);
    printMostReferred(pa.mostReferred, Padding);
    printMostDependencies(pa.mostDependencies, Padding);
    printMostVersion(pa.mostVersions, Padding, PaddingLeft);
    printSimpleLicenseInfo(pa.licensesByGroup, PaddingLeft);
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

function printSimpleDistinctDependencies(byName: number, padding: number): void {
    console.log(`${`Distinct dependencies:`.padEnd(padding)}${byName}`);
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
    let foundMultipleVersions = false;

    console.log(`${`Package(s) with multiple versions:`.padEnd(padding)}`);

    for (const [name, versions] of mostVerions) {
        if (versions.size > 1) {
            console.log(`${``.padStart(paddingLeft)}${name} [${[...versions].join(", ")}]`);
            foundMultipleVersions = true;
        }
    }

    if (!foundMultipleVersions) console.log(`${``.padStart(paddingLeft)}(none)`);
}

function printLicenseInfo(groupedLicenses: GroupedLicenseSummary, paddingLeft: number): void {
    console.log(`Licenses:`);
    for (const { license, names } of groupedLicenses) {
        const threshold = 4;
        const samples: string[] = names.slice(0, threshold);

        if (names.length > threshold)
            console.log(
                `${``.padStart(paddingLeft)}${license} - [${samples.join(", ")}, +${
                    names.length - threshold
                } more]`
            );
        else console.log(`${``.padStart(paddingLeft)}${license} - [${samples.join(", ")}]`);
    }
}

function printSimpleLicenseInfo(groupedLicenses: GroupedLicenseSummary, paddingLeft: number): void {
    console.log(`Licenses:`);
    for (const { license, names } of groupedLicenses) {
        console.log(`${``.padStart(paddingLeft)}${names.length}x ${license}`);
    }
}
