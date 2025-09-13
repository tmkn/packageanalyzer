import chalk from "chalk";
import { z } from "zod";

import { daysAgo } from "../cli/common.js";
import { releaseAttachment } from "../attachments/ReleaseAttachment.js";
import {
    DependencyUtilities,
    type IMostReferred,
    type VersionSummary
} from "../extensions/utilities/DependencyUtilities.js";
import {
    type GroupedLicenseSummary,
    LicenseUtilities
} from "../extensions/utilities/LicenseUtilities.js";
import { LoopUtilities } from "../extensions/utilities/LoopUtilities.js";
import { PathUtilities } from "../extensions/utilities/PathUtilities.js";
import { ReleaseUtilities } from "../extensions/utilities/ReleaseUtilities.js";
import { type IPackage } from "../package/package.js";
import { FileSystemPackageProvider } from "../providers/folder.js";
import { npmOnline } from "../providers/online.js";
import { type IFormatter } from "../utils/formatter.js";
import { getPackageVersionFromPath } from "../visitors/util.node.js";
import { getPackageVersionfromString } from "../visitors/visitor.js";
import {
    AbstractReport,
    type IReportConfig,
    type IReportContext,
    type ReportConfigs
} from "./Report.js";
import { BaseFolderParameter, BasePackageParameter, TypeParameter } from "./Validation.js";
import { type AttachmentData } from "../attachments/Attachments.js";

const FullParameter = z.object({
    full: z.boolean()
});

const PackageParams = BasePackageParameter.merge(TypeParameter).merge(FullParameter);

const FoldereParams = BaseFolderParameter.merge(TypeParameter).merge(FullParameter);

const AnalyzeParams = z.union([PackageParams, FoldereParams]);

export type IAnalyzeParams = z.infer<typeof AnalyzeParams>;

type ReleaseAttachment = {
    releaseinfo: ReturnType<typeof releaseAttachment>;
};

export class AnalyzeReport extends AbstractReport<
    IAnalyzeParams,
    ReportConfigs,
    z.ZodType<IAnalyzeParams>
> {
    name = `Analyze Report`;
    configs: IReportConfig;

    constructor(params: IAnalyzeParams) {
        super(params);

        if (this._isPackageParams(this.params)) {
            this.configs = {
                pkg: getPackageVersionfromString(this.params.package),
                attachments: { releaseinfo: releaseAttachment(npmOnline) }
            };
        } else {
            this.configs = {
                pkg: getPackageVersionFromPath(this.params.folder)
            };

            this.provider = new FileSystemPackageProvider(this.params.folder);
        }
    }

    async report(
        [pkg]: [IPackage<AttachmentData<ReleaseAttachment>>],
        { stdoutFormatter }: IReportContext
    ): Promise<void> {
        await printStatistics(pkg, this.params.full, stdoutFormatter);
    }

    private _isPackageParams(data: unknown): data is z.infer<typeof PackageParams> {
        return PackageParams.safeParse(data).success;
    }

    override validate(): z.ZodType<IAnalyzeParams> {
        return AnalyzeParams;
    }
}

export async function printStatistics(
    p: IPackage<AttachmentData<ReleaseAttachment>>,
    all: boolean,
    formatter: IFormatter
): Promise<void> {
    formatter.writeLine(`Statistics for ${chalk.bold(p.fullName)}\n`);

    all ? await printAllStatistics(p, formatter) : printBasicStatistics(p, formatter);
}

const PaddingLeft = 4;

async function printAllStatistics(
    p: IPackage<AttachmentData<ReleaseAttachment>>,
    formatter: IFormatter
): Promise<void> {
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

function printBasicStatistics(p: IPackage, formatter: IFormatter): void {
    printDependencyCount(p, formatter);
    printSimpleDistinctDependencies(new DependencyUtilities(p).distinctNameCount, formatter);
    printMostReferred(new DependencyUtilities(p).mostReferred, formatter);
    printMostDependencies(new DependencyUtilities(p).mostDirectDependencies, formatter);
    printMostVersion(new DependencyUtilities(p).mostVersions, PaddingLeft, formatter);
    printSimpleLicenseInfo(new LicenseUtilities(p).licensesByGroup, PaddingLeft, formatter);
}

function printDependencyCount(p: IPackage, formatter: IFormatter): void {
    formatter.writeGroup([
        [`Direct dependencies`, `${p.directDependencies.length}`],
        [`Transitive dependencies`, `${new DependencyUtilities(p).transitiveCount}`]
    ]);
}

async function printNewest(
    p: IPackage<AttachmentData<ReleaseAttachment>>,
    formatter: IFormatter
): Promise<void> {
    const { newestPackage } = new ReleaseUtilities(p);

    if (newestPackage) {
        const { publishDate } = new ReleaseUtilities(newestPackage);

        if (publishDate)
            formatter.writeGroup([
                [
                    `Newest package`,
                    `${newestPackage.fullName} - ${publishDate.toUTCString()} ${daysAgo(
                        publishDate
                    )}`
                ],
                [`Newest package path`, new PathUtilities(newestPackage).pathString]
            ]);
    }
}

async function printOldest(
    p: IPackage<AttachmentData<ReleaseAttachment>>,
    formatter: IFormatter
): Promise<void> {
    const { oldestPackage } = new ReleaseUtilities(p);

    if (oldestPackage) {
        const { publishDate } = new ReleaseUtilities(oldestPackage);

        if (publishDate)
            formatter.writeGroup([
                [
                    `Oldest package`,
                    `${oldestPackage.fullName} - ${publishDate.toUTCString()} ${daysAgo(
                        publishDate
                    )}`
                ],
                [`Oldest package path`, new PathUtilities(oldestPackage).pathString]
            ]);
    }
}

function printPublished(
    p: IPackage<AttachmentData<ReleaseAttachment>>,
    formatter: IFormatter
): void {
    const { publishDate: published } = new ReleaseUtilities(p);

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

function printLoops(p: IPackage, paddingLeft: number, formatter: IFormatter): void {
    const { loops, loopPathMap, distinctLoopCount } = new LoopUtilities(p);

    formatter.writeGroup([[`Loops`, `${loops.length} (${distinctLoopCount} distinct)`]]);

    if (distinctLoopCount > 0) {
        const [first] = loops
            .map(l => new PathUtilities(l).pathString)
            .sort((a, b) => a.localeCompare(b));
        const identBlock: [string, ...string[]] = [``];

        identBlock.push(`affected Packages: [${[...loopPathMap.keys()].join(", ")}]`);
        identBlock.push(`e.g. ${first}`);

        if (loops.length > 1) {
            identBlock.push(`${loops.length - 1} additional loops`);
        }

        formatter.writeIdentation(identBlock, paddingLeft);
    }
}

function printMostDependencies(pkgs: IPackage[], formatter: IFormatter): void {
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
