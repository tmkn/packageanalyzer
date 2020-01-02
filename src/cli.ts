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
        `${`-l`.padEnd(10)} ${`Analyze a local folder`.padEnd(60)} e.g. "npa -l path/to/project"`
    );
    console.log(
        `${`-o`.padEnd(10)} ${`Analyze a package, version optional, default latest`.padEnd(
            60
        )} e.g. "npa -o typescript(@3.5.1)"`
    );
    console.log(
        `${`-f`.padEnd(10)} ${`Analyze a package from a npm dump`.padEnd(
            60
        )} e.g. "npa -f path/to/npmdump typescript(@3.5.1)"`
    );
    console.log(
        `${`-lookup`.padEnd(10)} ${`Create a lookup file from a npm dump`.padEnd(
            60
        )} e.g. "npa -lookup path/to/npmdump"`
    );
    console.log(
        `${`-downloads`.padEnd(10)} ${`Get number of downloads from last week`.padEnd(
            60
        )} e.g. "npa -downloads typescript(@3.5.1)"`
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
        //console.log(e);
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

    console.log(`Statistics for ${pa.fullName}\n`);

    printPublished(pa, padding);
    printOldest(pa.oldest, padding);
    printNewest(pa.newest, padding);
    console.log(`${`Direct dependencies:`.padEnd(padding)}${pa.directDependencyCount}`);
    console.log(`${`Transitive dependencies:`.padEnd(padding)}${pa.transitiveDependenciesCount}`);
    printDistinctDependencies(pa.distinctByNameCount, pa.distinctByVersionCount, paddingLeft);
    printMostReferred(pa.mostReferred, padding);
    printMostDependencies(pa.mostDependencies, padding);
    printMostVersion(pa.mostVersions, padding, paddingLeft);
    printLoops(pa.loops, padding, paddingLeft);
    printLicenseInfo(pa.licensesByGroup, paddingLeft);
}

function printNewest(newest: PackageAnalytics | undefined, padding: number): void {
    if (newest && newest.published) {
        console.log(
            `${`Newest package:`.padEnd(padding)}${
                newest.fullName
            } - ${newest.published.toUTCString()} ${daysAgo(newest.published)}`
        );
    }
}

function printOldest(oldest: PackageAnalytics | undefined, padding: number): void {
    if (oldest && oldest.published) {
        console.log(
            `${`Oldest package:`.padEnd(padding)}${
                oldest.fullName
            } - ${oldest.published.toUTCString()} ${daysAgo(oldest.published)}`
        );
    }
}

function daysAgo(date: number | Date): string {
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

function printLoops(loops: PackageAnalytics[], padding: number, paddingLeft: number): void {
    console.log(`${`Loops:`.padEnd(padding)}${loops.length}`);

    if (loops.length > 0) {
        const [first] = loops.map(l => l.pathString).sort();

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
                `${``.padStart(paddingLeft)}${license} - [${samples.join(", ")}, +${names.length -
                    threshold} more]`
            );
        else console.log(`${``.padStart(paddingLeft)}${license} - [${samples.join(", ")}]`);
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
