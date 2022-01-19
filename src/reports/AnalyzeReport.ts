import * as chalk from "chalk";
import * as t from "io-ts";

import { daysAgo } from "../cli/common";
import { ReleaseDecorator } from "../extensions/decorators/ReleaseDecorator";
import {
    DependencyUtilities,
    IMostReferred,
    VersionSummary
} from "../extensions/utilities/DependencyUtilities";
import { GroupedLicenseSummary, LicenseUtilities } from "../extensions/utilities/LicenseUtilities";
import { LoopUtilities } from "../extensions/utilities/LoopUtilities";
import { PathUtilities } from "../extensions/utilities/PathUtilities";
import { ReleaseUtilities } from "../extensions/utilities/ReleaseUtilities";
import { Package } from "../package/package";
import { FileSystemPackageProvider } from "../providers/folder";
import { npmOnline } from "../providers/online";
import { IFormatter } from "../utils/formatter";
import { getPackageVersionFromPath } from "../visitors/util.node";
import { getPackageVersionfromString, PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";
import { BaseFolderParameter, BasePackageParameter, TypeParameter } from "./Validation";

const PackageParams = t.intersection([
    BasePackageParameter,
    TypeParameter,
    t.type({
        full: t.boolean
    })
]);

const FolderParams = t.intersection([
    BaseFolderParameter,
    TypeParameter,
    t.type({
        full: t.boolean
    })
]);

const AnalyzeParams = t.union([PackageParams, FolderParams]);

export type IAnalyzeParams = t.TypeOf<typeof AnalyzeParams>;

export class AnalyzeReport extends AbstractReport<IAnalyzeParams> {
    name = `Analyze Report`;
    pkg: PackageVersion;

    constructor(params: unknown) {
        super(params);

        if (PackageParams.is(this.params)) {
            this.pkg = getPackageVersionfromString(this.params.package);
            this.decorators = [new ReleaseDecorator(npmOnline)];
        } else if (FolderParams.is(this.params)) {
            this.pkg = getPackageVersionFromPath(this.params.folder);
            this.provider = new FileSystemPackageProvider(this.params.folder);
        } else {
            //todo error handling
            throw new Error(`Received wrong analyze parameters`);
        }
    }

    async report(pkg: Package, { stdoutFormatter }: IReportContext): Promise<void> {
        if (this.params) await printStatistics(pkg, this.params.full, stdoutFormatter);
    }

    validate(): t.Type<IAnalyzeParams> {
        return AnalyzeParams;
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
    const count = pkgs[0]?.directDependencies.length.toString() ?? `(error)`;

    formatter.writeGroup([[`Most direct dependencies`, `"[${names}]": ${count}`]]);
}

function printMostReferred(mostReferred: IMostReferred, formatter: IFormatter): void {
    let str: string = `(none)`;

    try {
        if (mostReferred.pkgs.length === 0) throw new Error();

        const names = [...mostReferred.pkgs.values()].map(name => name).join(`, `);
        str = `"[${names}]": ${mostReferred.count}`;
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
