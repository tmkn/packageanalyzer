import * as path from "path";
import * as fs from "fs";

import * as dayjs from "dayjs";
import * as chalk from "chalk";

import { Package, VersionSummary } from "../analyzers/package";
import { DependencyTypes } from "../visitors/visitor";
import { IFormatter } from "../formatter";
import { ReleaseStatistics } from "../extensions/statistics/ReleaseStatistics";
import { LoopStatistics } from "../extensions/statistics/LoopStatistics";
import {
    GroupedLicenseSummary,
    LicenseStatistics
} from "../extensions/statistics/LicenseStatistics";
import { PathStatistics } from "../extensions/statistics/PathStatistics";

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
        p.distinctByNameCount,
        p.distinctByVersionCount,
        PaddingLeft,
        formatter
    );
    printMostReferred(p.mostReferred, formatter);
    printMostDependencies(p.mostDependencies, formatter);
    printMostVersion(p.mostVersions, PaddingLeft, formatter);
    printLoops(p, PaddingLeft, formatter);
    printLicenseInfo(new LicenseStatistics(p).licensesByGroup, PaddingLeft, formatter);
}

export function printBasicStatistics(p: Package, formatter: IFormatter): void {
    printDependencyCount(p, formatter);
    printSimpleDistinctDependencies(p.distinctByNameCount, formatter);
    printMostReferred(p.mostReferred, formatter);
    printMostDependencies(p.mostDependencies, formatter);
    printMostVersion(p.mostVersions, PaddingLeft, formatter);
    printSimpleLicenseInfo(new LicenseStatistics(p).licensesByGroup, PaddingLeft, formatter);
}

function printDependencyCount(p: Package, formatter: IFormatter): void {
    formatter.writeGroup([
        [`Direct dependencies`, `${p.directDependencyCount}`],
        [`Transitive dependencies`, `${p.transitiveDependenciesCount}`]
    ]);
}

async function printNewest(newest: Package, formatter: IFormatter): Promise<void> {
    const { published } = new ReleaseStatistics(newest);

    if (published) {
        formatter.writeGroup([
            [
                `Newest package`,
                `${newest.fullName} - ${published.toUTCString()} ${daysAgo(published)}`
            ],
            [`Newest package path`, new PathStatistics(newest).pathString]
        ]);
    }
}

async function printOldest(oldest: Package, formatter: IFormatter): Promise<void> {
    const { published } = new ReleaseStatistics(oldest);

    if (published) {
        formatter.writeGroup([
            [
                `Oldest package`,
                `${oldest.fullName} - ${published.toUTCString()} ${daysAgo(published)}`
            ],
            [`Oldest package path`, new PathStatistics(oldest).pathString]
        ]);
    }
}

async function printPublished(p: Package, formatter: IFormatter): Promise<void> {
    const { published } = new ReleaseStatistics(p);

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
    const { loops, loopPathMap, distinctLoopCount } = new LoopStatistics(p);

    formatter.writeGroup([[`Loops`, `${loops.length} (${distinctLoopCount} distinct)`]]);

    if (distinctLoopCount > 0) {
        const [first] = loops.map(l => new PathStatistics(l).pathString).sort();
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
    formatter.writeGroup([[`Most direct dependencies`, `"${p.name}": ${p.directDependencyCount}`]]);
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
