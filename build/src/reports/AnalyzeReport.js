"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printStatistics = exports.AnalyzeReport = void 0;
const chalk = require("chalk");
const common_1 = require("../cli/common");
const ReleaseDecorator_1 = require("../extensions/decorators/ReleaseDecorator");
const DependencyUtilities_1 = require("../extensions/utilities/DependencyUtilities");
const LicenseUtilities_1 = require("../extensions/utilities/LicenseUtilities");
const LoopUtilities_1 = require("../extensions/utilities/LoopUtilities");
const PathUtilities_1 = require("../extensions/utilities/PathUtilities");
const ReleaseUtilities_1 = require("../extensions/utilities/ReleaseUtilities");
const folder_1 = require("../providers/folder");
const online_1 = require("../providers/online");
const utils_1 = require("../visitors/utils");
const Report_1 = require("./Report");
class AnalyzeReport extends Report_1.AbstractReport {
    constructor(params) {
        super();
        this.params = params;
        this.name = `Analyze Report`;
        if (params.package) {
            this.pkg = (0, utils_1.getPackageVersionfromString)(params.package);
            this.provider = online_1.npmOnline;
            this.decorators = [new ReleaseDecorator_1.ReleaseDecorator(online_1.npmOnline)];
        }
        else if (params.folder) {
            this.pkg = (0, utils_1.getPackageVersionFromPackageJson)(params.folder);
            this.provider = new folder_1.FileSystemPackageProvider(params.folder);
        }
        else {
            throw new Error(`No package or folder option provided`);
        }
        this.type = params.type ?? common_1.defaultDependencyType;
    }
    async report(pkg, { stdoutFormatter }) {
        await printStatistics(pkg, this.params.full, stdoutFormatter);
    }
}
exports.AnalyzeReport = AnalyzeReport;
async function printStatistics(p, all, formatter) {
    formatter.writeLine(`Statistics for ${chalk.bold(p.fullName)}\n`);
    all ? printAllStatistics(p, formatter) : printBasicStatistics(p, formatter);
}
exports.printStatistics = printStatistics;
const PaddingLeft = 4;
async function printAllStatistics(p, formatter) {
    printPublished(p, formatter);
    await printOldest(p, formatter);
    await printNewest(p, formatter);
    printDependencyCount(p, formatter);
    printDistinctDependencies(new DependencyUtilities_1.DependencyUtilities(p).distinctNameCount, new DependencyUtilities_1.DependencyUtilities(p).distinctVersionCount, PaddingLeft, formatter);
    printMostReferred(new DependencyUtilities_1.DependencyUtilities(p).mostReferred, formatter);
    printMostDependencies(new DependencyUtilities_1.DependencyUtilities(p).mostDirectDependencies, formatter);
    printMostVersion(new DependencyUtilities_1.DependencyUtilities(p).mostVersions, PaddingLeft, formatter);
    printLoops(p, PaddingLeft, formatter);
    printLicenseInfo(new LicenseUtilities_1.LicenseUtilities(p).licensesByGroup, PaddingLeft, formatter);
}
function printBasicStatistics(p, formatter) {
    printDependencyCount(p, formatter);
    printSimpleDistinctDependencies(new DependencyUtilities_1.DependencyUtilities(p).distinctNameCount, formatter);
    printMostReferred(new DependencyUtilities_1.DependencyUtilities(p).mostReferred, formatter);
    printMostDependencies(new DependencyUtilities_1.DependencyUtilities(p).mostDirectDependencies, formatter);
    printMostVersion(new DependencyUtilities_1.DependencyUtilities(p).mostVersions, PaddingLeft, formatter);
    printSimpleLicenseInfo(new LicenseUtilities_1.LicenseUtilities(p).licensesByGroup, PaddingLeft, formatter);
}
function printDependencyCount(p, formatter) {
    formatter.writeGroup([
        [`Direct dependencies`, `${p.directDependencies.length}`],
        [`Transitive dependencies`, `${new DependencyUtilities_1.DependencyUtilities(p).transitiveCount}`]
    ]);
}
async function printNewest(p, formatter) {
    const { newest } = new ReleaseUtilities_1.ReleaseUtilities(p);
    if (newest) {
        const { published } = new ReleaseUtilities_1.ReleaseUtilities(newest);
        if (published)
            formatter.writeGroup([
                [
                    `Newest package`,
                    `${newest.fullName} - ${published.toUTCString()} ${(0, common_1.daysAgo)(published)}`
                ],
                [`Newest package path`, new PathUtilities_1.PathUtilities(newest).pathString]
            ]);
    }
}
async function printOldest(p, formatter) {
    const { oldest } = new ReleaseUtilities_1.ReleaseUtilities(p);
    if (oldest) {
        const { published } = new ReleaseUtilities_1.ReleaseUtilities(oldest);
        if (published)
            formatter.writeGroup([
                [
                    `Oldest package`,
                    `${oldest.fullName} - ${published.toUTCString()} ${(0, common_1.daysAgo)(published)}`
                ],
                [`Oldest package path`, new PathUtilities_1.PathUtilities(oldest).pathString]
            ]);
    }
}
async function printPublished(p, formatter) {
    const { published } = new ReleaseUtilities_1.ReleaseUtilities(p);
    if (!published)
        return;
    formatter.writeGroup([[`Published`, `${published.toUTCString()} ${(0, common_1.daysAgo)(published)}`]]);
}
function printDistinctDependencies(byName, byNameAndVersion, paddingLeft, formatter) {
    formatter.writeIdentation([
        `Distinct dependencies:`,
        `${byName}: distinct name`,
        `${byNameAndVersion}: distinct name and version`
    ], paddingLeft);
}
function printSimpleDistinctDependencies(byName, formatter) {
    formatter.writeGroup([[`Distinct dependencies`, byName.toString()]]);
}
function printLoops(p, paddingLeft, formatter) {
    const { loops, loopPathMap, distinctLoopCount } = new LoopUtilities_1.LoopUtilities(p);
    formatter.writeGroup([[`Loops`, `${loops.length} (${distinctLoopCount} distinct)`]]);
    if (distinctLoopCount > 0) {
        const [first] = loops.map(l => new PathUtilities_1.PathUtilities(l).pathString).sort();
        const identBlock = [``];
        identBlock.push(`affected Packages: [${[...loopPathMap.keys()].join(", ")}]`);
        identBlock.push(`e.g. ${first}`);
        if (loops.length > 1) {
            identBlock.push(`${loops.length - 1} additional loops`);
        }
        formatter.writeIdentation(identBlock, paddingLeft);
    }
}
function printMostDependencies(pkgs, formatter) {
    const names = pkgs.map(p => p.name).join(`, `);
    const count = pkgs[0]?.directDependencies.length.toString() ?? `(error)`;
    formatter.writeGroup([[`Most direct dependencies`, `"[${names}]": ${count}`]]);
}
function printMostReferred(mostReferred, formatter) {
    let str = `(none)`;
    try {
        if (mostReferred.pkgs.length === 0)
            throw new Error();
        const names = [...mostReferred.pkgs.values()].map(name => name).join(`, `);
        str = `"[${names}]": ${mostReferred.count}`;
    }
    catch {
    }
    finally {
        formatter.writeGroup([[`Most referred package`, `${str}`]]);
    }
}
function printMostVersion(mostVerions, paddingLeft, formatter) {
    let foundMultipleVersions = false;
    const identBlock = [`Package(s) with multiple versions:`];
    for (const [name, versions] of mostVerions) {
        if (versions.size > 1) {
            identBlock.push(`${name} [${[...versions].join(", ")}]`);
            foundMultipleVersions = true;
        }
    }
    if (!foundMultipleVersions)
        identBlock.push(`(none)`);
    formatter.writeIdentation(identBlock, paddingLeft);
}
function printLicenseInfo(groupedLicenses, paddingLeft, formatter) {
    const identBlock = [`Licenses:`];
    for (const { license, names } of groupedLicenses) {
        const threshold = 4;
        const samples = names.slice(0, threshold);
        if (names.length > threshold)
            identBlock.push(`${license} - [${samples.join(", ")}, +${names.length - threshold} more]`);
        else
            identBlock.push(`${license} - [${samples.join(", ")}]`);
    }
    formatter.writeIdentation(identBlock, paddingLeft);
}
function printSimpleLicenseInfo(groupedLicenses, paddingLeft, formatter) {
    const identBlock = [`Licenses:`];
    for (const { license, names } of groupedLicenses) {
        identBlock.push(`${names.length}x ${license}`);
    }
    formatter.writeIdentation(identBlock, paddingLeft);
}
//# sourceMappingURL=AnalyzeReport.js.map