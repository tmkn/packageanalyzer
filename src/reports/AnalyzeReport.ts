import * as chalk from "chalk";

import { daysAgo, defaultDependencyType } from "../cli/common";
import { IDecorator } from "../extensions/decorators/Decorator";
import { ReleaseDecorator } from "../extensions/decorators/ReleaseDecorator";
import { DependencyUtilities, VersionSummary } from "../extensions/utilities/DependencyUtilities";
import { GroupedLicenseSummary, LicenseUtilities } from "../extensions/utilities/LicenseUtilities";
import { LoopUtilities } from "../extensions/utilities/LoopUtilities";
import { PathUtilities } from "../extensions/utilities/PathUtilities";
import { ReleaseUtilities } from "../extensions/utilities/ReleaseUtilities";
import { Package } from "../package/package";
import { FileSystemPackageProvider } from "../providers/folder";
import { npmOnline } from "../providers/online";
import { IPackageVersionProvider } from "../providers/provider";
import { IFormatter } from "../utils/formatter";
import {
    DependencyTypes,
    getPackageVersionFromPackageJson,
    getPackageVersionfromString,
    PackageVersion
} from "../visitors/visitor";
import { IReport } from "./Report";

export interface IAnalyzeParams {
    package?: string;
    folder?: string;
    type?: DependencyTypes;
    full: boolean;
}

export class AnalyzeReport implements IReport<IAnalyzeParams> {
    name = `Analyze Report`;
    pkg: PackageVersion;
    type: DependencyTypes;
    provider?: IPackageVersionProvider;
    decorators?: IDecorator<any, any>[] = [];

    constructor(readonly params: IAnalyzeParams) {
        if (params.package) {
            this.pkg = getPackageVersionfromString(params.package);
            this.provider = npmOnline;
            this.decorators = [new ReleaseDecorator(npmOnline)];
        } else if (params.folder) {
            this.pkg = getPackageVersionFromPackageJson(params.folder);
            this.provider = new FileSystemPackageProvider(params.folder);
        } else {
            throw new Error(`No package or folder option provided`);
        }

        this.type = params.type ?? defaultDependencyType;
    }

    async report(pkg: Package, formatter: IFormatter): Promise<void> {
        await printStatistics(pkg, this.params.full, formatter);
    }
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

async function printAllStatistics(p: Package, formatter: IFormatter): Promise<void> {
    printPublished(p, formatter);
    await printOldest(p, formatter);
    await printNewest(p, formatter);
    printDependencyCount(p, formatter);
    printDistinctDependencies(
        new DependencyUtilities(p).distinctNameCount,
        new DependencyUtilities(p).distinctVersionCount,
        PaddingLeft,
        formatter
    );
    printMostReferred(new DependencyUtilities(p).mostReferred, formatter);
    printMostDependencies(new DependencyUtilities(p).mostDirectDependencies, formatter);
    printMostVersion(new DependencyUtilities(p).mostVersions, PaddingLeft, formatter);
    printLoops(p, PaddingLeft, formatter);
    printLicenseInfo(new LicenseUtilities(p).licensesByGroup, PaddingLeft, formatter);
}

function printBasicStatistics(p: Package, formatter: IFormatter): void {
    printDependencyCount(p, formatter);
    printSimpleDistinctDependencies(new DependencyUtilities(p).distinctNameCount, formatter);
    printMostReferred(new DependencyUtilities(p).mostReferred, formatter);
    printMostDependencies(new DependencyUtilities(p).mostDirectDependencies, formatter);
    printMostVersion(new DependencyUtilities(p).mostVersions, PaddingLeft, formatter);
    printSimpleLicenseInfo(new LicenseUtilities(p).licensesByGroup, PaddingLeft, formatter);
}

function printDependencyCount(p: Package, formatter: IFormatter): void {
    formatter.writeGroup([
        [`Direct dependencies`, `${p.directDependencies.length}`],
        [`Transitive dependencies`, `${new DependencyUtilities(p).transitiveCount}`]
    ]);
}

async function printNewest(p: Package, formatter: IFormatter): Promise<void> {
    const { newest } = new ReleaseUtilities(p);

    if (newest) {
        const { published } = new ReleaseUtilities(newest);

        if (published)
            formatter.writeGroup([
                [
                    `Newest package`,
                    `${newest.fullName} - ${published.toUTCString()} ${daysAgo(published)}`
                ],
                [`Newest package path`, new PathUtilities(newest).pathString]
            ]);
    }
}

async function printOldest(p: Package, formatter: IFormatter): Promise<void> {
    const { oldest } = new ReleaseUtilities(p);

    if (oldest) {
        const { published } = new ReleaseUtilities(oldest);

        if (published)
            formatter.writeGroup([
                [
                    `Oldest package`,
                    `${oldest.fullName} - ${published.toUTCString()} ${daysAgo(published)}`
                ],
                [`Oldest package path`, new PathUtilities(oldest).pathString]
            ]);
    }
}

async function printPublished(p: Package, formatter: IFormatter): Promise<void> {
    const { published } = new ReleaseUtilities(p);

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
    const { loops, loopPathMap, distinctLoopCount } = new LoopUtilities(p);

    formatter.writeGroup([[`Loops`, `${loops.length} (${distinctLoopCount} distinct)`]]);

    if (distinctLoopCount > 0) {
        const [first] = loops.map(l => new PathUtilities(l).pathString).sort();
        const identBlock: [string, ...string[]] = [``];

        identBlock.push(`affected Packages: [${[...loopPathMap.keys()].join(", ")}]`);
        identBlock.push(`e.g. ${first}`);

        if (loops.length > 1) {
            identBlock.push(`${loops.length - 1} additional loops`);
        }

        formatter.writeIdentation(identBlock, paddingLeft);
    }
}

function printMostDependencies(pkgs: Package[], formatter: IFormatter): void {
    const names = pkgs.map(p => p.name).join(`, `);

    formatter.writeGroup([
        [`Most direct dependencies`, `"[${names}]": ${pkgs[0].directDependencies.length}`]
    ]);
}

function printMostReferred(arg: [string, number][], formatter: IFormatter): void {
    let str: string = `(none)`;

    try {
        const [, num] = [...arg.values()][0];
        const names = [...arg.values()].map(([name]) => name).join(`, `);
        str = `"[${names}]": ${num}`;
    } catch {
    } finally {
        formatter.writeGroup([[`Most referred package`, `${str}`]]);
    }
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
