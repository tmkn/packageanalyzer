import * as path from "path";
import * as fs from "fs";

import * as dayjs from "dayjs";
import * as chalk from "chalk";

import { Package } from "../package/package";
import { DependencyTypes } from "../visitors/visitor";
import { IFormatter } from "../utils/formatter";
import { ReleaseMetrics } from "../extensions/metrics/ReleaseMetrics";
import { LoopMetrics } from "../extensions/metrics/LoopMetrics";
import { GroupedLicenseSummary, LicenseMetrics } from "../extensions/metrics/LicenseMetrics";
import { PathMetrics } from "../extensions/metrics/PathMetrics";
import { DependencyMetrics, VersionSummary } from "../extensions/metrics/DependencyMetrics";

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

export async function printStatistics(
    p: Package,
    all: boolean,
    formatter: IFormatter
): Promise<void> {
    formatter.writeLine(`Statistics for ${chalk.bold(p.fullName)}\n`);

    all ? printAllStatistics(p, formatter) : printBasicStatistics(p, formatter);
}

const PaddingLeft = 4;

export async function printAllStatistics(p: Package, formatter: IFormatter): Promise<void> {
    printPublished(p, formatter);
    await printOldest(p, formatter);
    await printNewest(p, formatter);
    printDependencyCount(p, formatter);
    printDistinctDependencies(
        new DependencyMetrics(p).distinctByNameCount,
        new DependencyMetrics(p).distinctByVersionCount,
        PaddingLeft,
        formatter
    );
    printMostReferred(new DependencyMetrics(p).mostReferred, formatter);
    printMostDependencies(new DependencyMetrics(p).mostDependencies, formatter);
    printMostVersion(new DependencyMetrics(p).mostVersions, PaddingLeft, formatter);
    printLoops(p, PaddingLeft, formatter);
    printLicenseInfo(new LicenseMetrics(p).licensesByGroup, PaddingLeft, formatter);
}

export function printBasicStatistics(p: Package, formatter: IFormatter): void {
    printDependencyCount(p, formatter);
    printSimpleDistinctDependencies(new DependencyMetrics(p).distinctByNameCount, formatter);
    printMostReferred(new DependencyMetrics(p).mostReferred, formatter);
    printMostDependencies(new DependencyMetrics(p).mostDependencies, formatter);
    printMostVersion(new DependencyMetrics(p).mostVersions, PaddingLeft, formatter);
    printSimpleLicenseInfo(new LicenseMetrics(p).licensesByGroup, PaddingLeft, formatter);
}

function printDependencyCount(p: Package, formatter: IFormatter): void {
    formatter.writeGroup([
        [`Direct dependencies`, `${p.directDependencies.length}`],
        [`Transitive dependencies`, `${new DependencyMetrics(p).transitiveDependenciesCount}`]
    ]);
}

async function printNewest(newest: Package, formatter: IFormatter): Promise<void> {
    const { published } = new ReleaseMetrics(newest);

    if (published) {
        formatter.writeGroup([
            [
                `Newest package`,
                `${newest.fullName} - ${published.toUTCString()} ${daysAgo(published)}`
            ],
            [`Newest package path`, new PathMetrics(newest).pathString]
        ]);
    }
}

async function printOldest(oldest: Package, formatter: IFormatter): Promise<void> {
    const { published } = new ReleaseMetrics(oldest);

    if (published) {
        formatter.writeGroup([
            [
                `Oldest package`,
                `${oldest.fullName} - ${published.toUTCString()} ${daysAgo(published)}`
            ],
            [`Oldest package path`, new PathMetrics(oldest).pathString]
        ]);
    }
}

async function printPublished(p: Package, formatter: IFormatter): Promise<void> {
    const { published } = new ReleaseMetrics(p);

    if (!published) return;

    formatter.writeGroup([[`Published`, `${published.toUTCString()} ${daysAgo(published)}`]]);
}

function printDistinctDependencies(
    byName: number,
    byNameAndVersion: number,
    paddingLeft: number,
    formatter: IFormatter
): void {
    formatter.writeIdentation(
        [
            `Distinct dependencies:`,
            `${byName}: distinct name`,
            `${byNameAndVersion}: distinct name and version`
        ],
        paddingLeft
    );
}

function printSimpleDistinctDependencies(byName: number, formatter: IFormatter): void {
    formatter.writeGroup([[`Distinct dependencies`, byName.toString()]]);
}

function printLoops(p: Package, paddingLeft: number, formatter: IFormatter): void {
    const { loops, loopPathMap, distinctLoopCount } = new LoopMetrics(p);

    formatter.writeGroup([[`Loops`, `${loops.length} (${distinctLoopCount} distinct)`]]);

    if (distinctLoopCount > 0) {
        const [first] = loops.map(l => new PathMetrics(l).pathString).sort();
        const identBlock: [string, ...string[]] = [``];

        identBlock.push(`affected Packages: [${[...loopPathMap.keys()].join(", ")}]`);
        identBlock.push(`e.g. ${first}`);

        if (loops.length > 1) {
            identBlock.push(`${loops.length - 1} additional loops`);
        }

        formatter.writeIdentation(identBlock, paddingLeft);
    }
}

function printMostDependencies(p: Package, formatter: IFormatter): void {
    formatter.writeGroup([
        [`Most direct dependencies`, `"${p.name}": ${p.directDependencies.length}`]
    ]);
}

function printMostReferred(arg: [string, number], formatter: IFormatter): void {
    formatter.writeGroup([[`Most referred package`, `"${arg[0]}": ${arg[1]}x`]]);
}

function printMostVersion(
    mostVerions: VersionSummary,
    paddingLeft: number,
    formatter: IFormatter
): void {
    let foundMultipleVersions = false;
    const identBlock: [string, ...string[]] = [`Package(s) with multiple versions:`];

    for (const [name, versions] of mostVerions) {
        if (versions.size > 1) {
            identBlock.push(`${name} [${[...versions].join(", ")}]`);
            foundMultipleVersions = true;
        }
    }

    if (!foundMultipleVersions) identBlock.push(`(none)`);

    formatter.writeIdentation(identBlock, paddingLeft);
}

function printLicenseInfo(
    groupedLicenses: GroupedLicenseSummary,
    paddingLeft: number,
    formatter: IFormatter
): void {
    const identBlock: [string, ...string[]] = [`Licenses:`];

    for (const { license, names } of groupedLicenses) {
        const threshold = 4;
        const samples: string[] = names.slice(0, threshold);

        if (names.length > threshold)
            identBlock.push(
                `${license} - [${samples.join(", ")}, +${names.length - threshold} more]`
            );
        else identBlock.push(`${license} - [${samples.join(", ")}]`);
    }

    formatter.writeIdentation(identBlock, paddingLeft);
}

function printSimpleLicenseInfo(
    groupedLicenses: GroupedLicenseSummary,
    paddingLeft: number,
    formatter: IFormatter
): void {
    const identBlock: [string, ...string[]] = [`Licenses:`];

    for (const { license, names } of groupedLicenses) {
        identBlock.push(`${names.length}x ${license}`);
    }

    formatter.writeIdentation(identBlock, paddingLeft);
}
