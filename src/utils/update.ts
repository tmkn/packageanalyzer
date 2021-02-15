import * as semver from "semver";
import { isUnpublished, INpmPackage } from "../npm";
import { INpmPackageProvider } from "../providers/folder";

interface IReleaseInfo {
    version: string;
    releaseDate: string;
}

interface IUpdateResult {
    name: string;
    version: string;
    latestOverall: IReleaseInfo;
    latestSemanticMatch: IReleaseInfo;
    latestMinor: IReleaseInfo;
    latestBugfix: IReleaseInfo;
}

export function cleanVersion(rawVersion: string): string {
    const { version } = semver.coerce(rawVersion) ?? {};

    if (typeof version === "undefined") throw new Error(`Couldn't clean version ${rawVersion}`);

    return version;
}

export function getBugfixVersionString(rawVersion: string): string {
    return `~${cleanVersion(rawVersion)}`;
}

export function getMinorVersionString(rawVersion: string): string {
    return `^${cleanVersion(rawVersion)}`;
}

function latestVersion(pkgInfo: INpmPackage): IReleaseInfo {
    const latest = pkgInfo["dist-tags"].latest;

    return {
        version: latest,
        releaseDate: pkgInfo.time[latest]
    };
}

function getMaxSatisfyingVersion(pkgInfo: INpmPackage, version: string): string {
    const versions: string[] = [...Object.keys(pkgInfo.versions)];
    const maxSatisfying = semver.maxSatisfying(versions, version);

    if (maxSatisfying === null) throw new Error(`Couldn't find a version match`);

    return maxSatisfying;
}

function getReleaseDate(pkgInfo: INpmPackage, version: string): string {
    const releaseDate = pkgInfo.time[version];

    if (typeof releaseDate === "undefined")
        throw new Error(`Couldn't find a release date for ${pkgInfo.name}@${version}`);

    return releaseDate;
}

async function getNpmPackage(name: string, provider: INpmPackageProvider): Promise<INpmPackage> {
    const pkgInfo = await provider.getPackageInfo(name);

    if (typeof pkgInfo === "undefined" || isUnpublished(pkgInfo))
        throw new Error(`Couldn't get data`);

    return pkgInfo;
}

export async function updateCheck(
    name: string,
    version: string,
    provider: INpmPackageProvider
): Promise<IReleaseInfo> {
    const pkgInfo = await getNpmPackage(name, provider);
    const maxSatisfying = getMaxSatisfyingVersion(pkgInfo, version);
    const releaseDate = getReleaseDate(pkgInfo, maxSatisfying);

    return {
        version: maxSatisfying,
        releaseDate: releaseDate
    };
}

export async function updateInfo(
    name: string,
    version: string,
    provider: INpmPackageProvider
): Promise<IUpdateResult> {
    const bugfixVersionString = getBugfixVersionString(version);
    const minorVersionString = getMinorVersionString(version);

    const pkgInfo = await getNpmPackage(name, provider);
    const semVerUpdate: IReleaseInfo = await updateCheck(name, version, provider);
    const bugfixUpdate: IReleaseInfo = await updateCheck(name, bugfixVersionString, provider);
    const minorUpdate: IReleaseInfo = await updateCheck(name, minorVersionString, provider);
    const latestUpdate: IReleaseInfo = latestVersion(pkgInfo);

    return {
        name,
        version,
        latestOverall: latestUpdate,
        latestSemanticMatch: semVerUpdate,
        latestBugfix: bugfixUpdate,
        latestMinor: minorUpdate
    };
}
