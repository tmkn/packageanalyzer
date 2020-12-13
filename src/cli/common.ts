import * as path from "path";
import * as fs from "fs";

import * as dayjs from "dayjs";
import * as chalk from "chalk";

import { PackageAnalytics, VersionSummary, GroupedLicenseSummary } from "../analyzers/package";
import { DependencyTypes } from "../visitors/visitor";
import { Writable } from "stream";

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

export function printStatistics(pa: PackageAnalytics, all: boolean, stdout: Writable): void {
    stdout.write(`Statistics for ${chalk.bold(pa.fullName)}\n`);

    all ? printAllStatistics(pa, stdout) : printBasicStatistics(pa, stdout);
}

const Padding = 40;
const PaddingLeft = 4;

export function printAllStatistics(pa: PackageAnalytics, stdout: Writable): void {
    printPublished(pa, Padding, stdout);
    printOldest(pa.oldest, Padding, stdout);
    printNewest(pa.newest, Padding, stdout);
    stdout.write(`${`Direct dependencies:`.padEnd(Padding)}${pa.directDependencyCount}\n`);
    stdout.write(
        `${`Transitive dependencies:`.padEnd(Padding)}${pa.transitiveDependenciesCount}\n`
    );
    printDistinctDependencies(
        pa.distinctByNameCount,
        pa.distinctByVersionCount,
        PaddingLeft,
        stdout
    );
    printMostReferred(pa.mostReferred, Padding, stdout);
    printMostDependencies(pa.mostDependencies, Padding, stdout);
    printMostVersion(pa.mostVersions, Padding, PaddingLeft, stdout);
    printLoops(pa, Padding, PaddingLeft, stdout);
    printLicenseInfo(pa.licensesByGroup, PaddingLeft, stdout);
}

export function printBasicStatistics(pa: PackageAnalytics, stdout: Writable): void {
    stdout.write(`${`Direct dependencies:`.padEnd(Padding)}${pa.directDependencyCount}\n`);
    stdout.write(
        `${`Transitive dependencies:`.padEnd(Padding)}${pa.transitiveDependenciesCount}\n`
    );
    printSimpleDistinctDependencies(pa.distinctByNameCount, Padding, stdout);
    printMostReferred(pa.mostReferred, Padding, stdout);
    printMostDependencies(pa.mostDependencies, Padding, stdout);
    printMostVersion(pa.mostVersions, Padding, PaddingLeft, stdout);
    printSimpleLicenseInfo(pa.licensesByGroup, PaddingLeft, stdout);
}

function printNewest(
    newest: PackageAnalytics | undefined,
    padding: number,
    stdout: Writable
): void {
    if (newest && newest.published) {
        stdout.write(
            `${`Newest package:`.padEnd(padding)}${
                newest.fullName
            } - ${newest.published.toUTCString()} ${daysAgo(newest.published)}\n`
        );
        stdout.write(`${`Newest package path:`.padEnd(padding)}${newest.pathString}\n`);
    }
}

function printOldest(
    oldest: PackageAnalytics | undefined,
    padding: number,
    stdout: Writable
): void {
    if (oldest && oldest.published) {
        stdout.write(
            `${`Oldest package:`.padEnd(padding)}${
                oldest.fullName
            } - ${oldest.published.toUTCString()} ${daysAgo(oldest.published)}\n`
        );
        stdout.write(`${`Oldest package path:`.padEnd(padding)}${oldest.pathString}\n`);
    }
}

function printPublished(pa: PackageAnalytics, padding: number, stdout: Writable): void {
    if (!pa.published) return;

    stdout.write(
        `${`Published:`.padEnd(padding)}${pa.published.toUTCString()} ${daysAgo(pa.published)}\n`
    );
}

function printDistinctDependencies(
    byName: number,
    byNameAndVersion: number,
    paddingLeft: number,
    stdout: Writable
): void {
    stdout.write(`Distinct dependencies:\n`);
    stdout.write(`${``.padStart(paddingLeft)}${byName}: distinct name\n`);
    stdout.write(`${``.padStart(paddingLeft)}${byNameAndVersion}: distinct name and version\n`);
}

function printSimpleDistinctDependencies(byName: number, padding: number, stdout: Writable): void {
    stdout.write(`${`Distinct dependencies:`.padEnd(padding)}${byName}\n`);
}

function printLoops(
    pa: PackageAnalytics,
    padding: number,
    paddingLeft: number,
    stdout: Writable
): void {
    const { loops, loopPathMap, distinctLoopCount } = pa;

    stdout.write(`${`Loops:`.padEnd(padding)}${loops.length} (${distinctLoopCount} distinct)\n`);

    if (distinctLoopCount > 0) {
        const [first] = loops.map(l => l.pathString).sort();

        stdout.write(`    affected Packages: [${[...loopPathMap.keys()].join(", ")}]\n`);
        stdout.write(`    e.g. ${first}\n`);

        if (loops.length > 1)
            stdout.write(`${``.padStart(paddingLeft)}+${loops.length - 1} additional loops\n`);
    }
}

function printMostDependencies(pa: PackageAnalytics, padding: number, stdout: Writable): void {
    stdout.write(
        `${`Most direct dependencies:`.padEnd(padding)}"${pa.name}": ${pa.directDependencyCount}\n`
    );
}

function printMostReferred(arg: [string, number], padding: number, stdout: Writable): void {
    stdout.write(`${`Most referred package:`.padEnd(padding)}"${arg[0]}": ${arg[1]}x\n`);
}

function printMostVersion(
    mostVerions: VersionSummary,
    padding: number,
    paddingLeft: number,
    stdout: Writable
): void {
    let foundMultipleVersions = false;

    stdout.write(`${`Package(s) with multiple versions:`.padEnd(padding)}\n`);

    for (const [name, versions] of mostVerions) {
        if (versions.size > 1) {
            stdout.write(`${``.padStart(paddingLeft)}${name} [${[...versions].join(", ")}]\n`);
            foundMultipleVersions = true;
        }
    }

    if (!foundMultipleVersions) stdout.write(`${``.padStart(paddingLeft)}(none)\n`);
}

function printLicenseInfo(
    groupedLicenses: GroupedLicenseSummary,
    paddingLeft: number,
    stdout: Writable
): void {
    stdout.write(`Licenses:\n`);
    for (const { license, names } of groupedLicenses) {
        const threshold = 4;
        const samples: string[] = names.slice(0, threshold);

        if (names.length > threshold)
            stdout.write(
                `${``.padStart(paddingLeft)}${license} - [${samples.join(", ")}, +${
                    names.length - threshold
                } more]\n`
            );
        else stdout.write(`${``.padStart(paddingLeft)}${license} - [${samples.join(", ")}]\n`);
    }
}

function printSimpleLicenseInfo(
    groupedLicenses: GroupedLicenseSummary,
    paddingLeft: number,
    stdout: Writable
): void {
    stdout.write(`Licenses:\n`);
    for (const { license, names } of groupedLicenses) {
        stdout.write(`${``.padStart(paddingLeft)}${names.length}x ${license}\n`);
    }
}
