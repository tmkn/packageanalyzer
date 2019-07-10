#!/usr/bin/env node

const pkg = require("./../../package.json");

import { resolveFromFolder } from "./resolvers/folderResolver";
import { resolveFromName } from "./resolvers/nameResolver";
import { npmOnline } from "./providers/onlineProvider";
import { PackageAnalytics, LicenseSummary, VersionSummary, getNameAndVersion } from "./analyzer";

let commandFound = false;

process.argv.forEach((arg, i) => {
    if (arg === "-v" && !commandFound) {
        console.log(`Version ${pkg.version}`);
        commandFound = true;
    } else if (arg === "-h" && !commandFound) {
        showHelp();
        commandFound = true;
    } else if (arg === "-f" && !commandFound) {
        let folder = process.argv[i + 1];

        cliResolveFolder(folder);
        commandFound = true;
    } else if (arg === "-o" && !commandFound) {
        let name = process.argv[i + 1];

        cliResolveName(name);
        commandFound = true;
    }
});

if (!commandFound) {
    console.log(`No command found`);
    showHelp();
}

function showHelp(): void {
    console.log(`Package Analyzer ${pkg.version}`);
    console.log(`Options:`);
    console.log(
        `${`-f`.padEnd(10)} ${`Analyze a local folder`.padEnd(60)} e.g. "npa -f path/to/project"`
    );
    console.log(
        `${`-o`.padEnd(10)} ${`Analyze a package, version optional, default latest`.padEnd(
            60
        )} e.g. "npa -o typescript(@3.5.1)"`
    );
    console.log(`${`-v`.padEnd(10)} ${`Prints version`.padEnd(60)}`);
    console.log(`${`-h`.padEnd(10)} ${`Display help`.padEnd(60)}`);
}

async function cliResolveFolder(folder: string | undefined): Promise<void> {
    if (typeof folder === "undefined") {
        console.log(`Missing folder path\n`);
        showHelp();

        return;
    }

    try {
        let pa: PackageAnalytics = await resolveFromFolder(folder);

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
        const [name, version] = getNameAndVersion(pkgName);
        let pa: PackageAnalytics;

        if (typeof version === "undefined") pa = await resolveFromName(name, npmOnline);
        else pa = await resolveFromName([name, version], npmOnline);

        printStatistics(pa);
    } catch (e) {
        console.log(e);
    }
}

function printStatistics(pa: PackageAnalytics): void {
    const padding = 40;

    console.log(`Statistics for ${pa.fullName}\n`);

    console.log(`${`Direct dependencies:`.padEnd(padding)}${pa.directDependencyCount}`);
    console.log(`${`Transitive dependencies:`.padEnd(padding)}${pa.transitiveDependenciesCount}`);
    console.log(`${`Distinct dependencies:`.padEnd(padding)}${pa.distinctDependenciesCount}`);
    printMostReferred(pa.mostReferred, padding);
    printMostDependencies(pa.mostDependencies, padding);
    printMostVersion(pa.mostVersions, padding);
    printLicenseInfo(pa.licenses);
}

function printMostDependencies(pa: PackageAnalytics, padding: number): void {
    console.log(
        `${`Package with most direct dependencies:`.padEnd(padding)}${pa.directDependencyCount} "${
            pa.name
        }"`
    );
}

function printMostReferred(arg: [string, number], padding: number): void {
    console.log(`${`Most referred package:`.padEnd(padding)}${arg[1]}x "${arg[0]}"`);
}

function printMostVersion(mostVerions: VersionSummary, padding: number): void {
    console.log(`${`Package(s) with most versions:`.padEnd(padding)}`);

    for (const [name, versions] of mostVerions) {
        console.log(`    ${name} [${[...versions].join(", ")}]`);
    }
}

function printLicenseInfo(allLicenses: LicenseSummary): void {
    let summary = new Map<string, number>();
    let longestLine = 0;

    for (const [, licenses] of allLicenses) {
        for (const [, license] of licenses) {
            let specificLicense = summary.get(license);

            if (!specificLicense) {
                summary.set(license, 1);
            } else {
                summary.set(license, specificLicense + 1);
            }

            if (license.length > longestLine) longestLine = license.length;
        }
    }

    console.log(`Licenses:`);
    for (const [license, count] of summary) {
        console.log(`    ${count}x ${license}`);
    }

    /*let longestLine = 0;

    for(const [name, licenses] of allLicenses) {
        for(const [version, license] of licenses) {
            let fullName = `${name}@${version}`;

            if(fullName.length > longestLine)
                longestLine = fullName.length;
        }
    }

    for(const [name, licenses] of allLicenses) {
        for(const [version, license] of licenses) {
            console.log(`${`${name}@${version}`.padEnd(longestLine + 1)}${license}`.padStart(8));
        }
    }*/
}
