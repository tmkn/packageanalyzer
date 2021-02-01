import * as path from "path";
import * as fs from "fs";

import * as dayjs from "dayjs";
import * as chalk from "chalk";

import { Package, VersionSummary, GroupedLicenseSummary } from "../analyzers/package";
import { DependencyTypes } from "../visitors/visitor";
import { Writable } from "stream";
import { ReleaseAnalysis } from "../analyses/ReleaseAnalysis";

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

export function printStatistics(p: Package, all: boolean, stdout: Writable): void {
    stdout.write(`Statistics for ${chalk.bold(p.fullName)}\n`);

    all ? printAllStatistics(p, stdout) : printBasicStatistics(p, stdout);
}

const Padding = 40;
const PaddingLeft = 4;

export async function printAllStatistics(p: Package, stdout: Writable): Promise<void> {
    const { newest, oldest } = await new ReleaseAnalysis().apply(p);

    await printPublished(p, Padding, stdout);
    await printOldest(oldest, Padding, stdout);
    await printNewest(newest, Padding, stdout);
    stdout.write(`${`Direct dependencies:`.padEnd(Padding)}${p.directDependencyCount}\n`);
    stdout.write(`${`Transitive dependencies:`.padEnd(Padding)}${p.transitiveDependenciesCount}\n`);
    printDistinctDependencies(p.distinctByNameCount, p.distinctByVersionCount, PaddingLeft, stdout);
    printMostReferred(p.mostReferred, Padding, stdout);
    printMostDependencies(p.mostDependencies, Padding, stdout);
    printMostVersion(p.mostVersions, Padding, PaddingLeft, stdout);
    printLoops(p, Padding, PaddingLeft, stdout);
    printLicenseInfo(p.licensesByGroup, PaddingLeft, stdout);
}

export function printBasicStatistics(p: Package, stdout: Writable): void {
    stdout.write(`${`Direct dependencies:`.padEnd(Padding)}${p.directDependencyCount}\n`);
    stdout.write(`${`Transitive dependencies:`.padEnd(Padding)}${p.transitiveDependenciesCount}\n`);
    printSimpleDistinctDependencies(p.distinctByNameCount, Padding, stdout);
    printMostReferred(p.mostReferred, Padding, stdout);
    printMostDependencies(p.mostDependencies, Padding, stdout);
    printMostVersion(p.mostVersions, Padding, PaddingLeft, stdout);
    printSimpleLicenseInfo(p.licensesByGroup, PaddingLeft, stdout);
}

async function printNewest(
    newest: Package | undefined,
    padding: number,
    stdout: Writable
): Promise<void> {
    if (newest) {
        const { published } = await new ReleaseAnalysis().apply(newest);

        if (published) {
            stdout.write(
                `${`Newest package:`.padEnd(padding)}${
                    newest.fullName
                } - ${published.toUTCString()} ${daysAgo(published)}\n`
            );
            stdout.write(`${`Newest package path:`.padEnd(padding)}${newest.pathString}\n`);
        }
    }
}

async function printOldest(
    oldest: Package | undefined,
    padding: number,
    stdout: Writable
): Promise<void> {
    if (oldest) {
        const { published } = await new ReleaseAnalysis().apply(oldest);

        if (published) {
            stdout.write(
                `${`Oldest package:`.padEnd(padding)}${
                    oldest.fullName
                } - ${published.toUTCString()} ${daysAgo(published)}\n`
            );
            stdout.write(`${`Oldest package path:`.padEnd(padding)}${oldest.pathString}\n`);
        }
    }
}

async function printPublished(p: Package, padding: number, stdout: Writable): Promise<void> {
    const { published } = await new ReleaseAnalysis().apply(p);

    if (!published) return;

    stdout.write(
        `${`Published:`.padEnd(padding)}${published.toUTCString()} ${daysAgo(published)}\n`
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

function printLoops(p: Package, padding: number, paddingLeft: number, stdout: Writable): void {
    const { loops, loopPathMap, distinctLoopCount } = p;

    stdout.write(`${`Loops:`.padEnd(padding)}${loops.length} (${distinctLoopCount} distinct)\n`);

    if (distinctLoopCount > 0) {
        const [first] = loops.map(l => l.pathString).sort();

        stdout.write(`    affected Packages: [${[...loopPathMap.keys()].join(", ")}]\n`);
        stdout.write(`    e.g. ${first}\n`);

        if (loops.length > 1)
            stdout.write(`${``.padStart(paddingLeft)}+${loops.length - 1} additional loops\n`);
    }
}

function printMostDependencies(p: Package, padding: number, stdout: Writable): void {
    stdout.write(
        `${`Most direct dependencies:`.padEnd(padding)}"${p.name}": ${p.directDependencyCount}\n`
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
