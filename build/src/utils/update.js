"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInfo = exports.updateCheck = exports.getMinorVersionString = exports.getBugfixVersionString = exports.cleanVersion = void 0;
const semver = require("semver");
const npm_1 = require("../npm");
function cleanVersion(rawVersion) {
    const { version } = semver.coerce(rawVersion) ?? {};
    if (typeof version === "undefined")
        throw new Error(`Couldn't clean version ${rawVersion}`);
    return version;
}
exports.cleanVersion = cleanVersion;
function getBugfixVersionString(rawVersion) {
    return `~${cleanVersion(rawVersion)}`;
}
exports.getBugfixVersionString = getBugfixVersionString;
function getMinorVersionString(rawVersion) {
    return `^${cleanVersion(rawVersion)}`;
}
exports.getMinorVersionString = getMinorVersionString;
function latestVersion(pkgInfo) {
    const latest = pkgInfo["dist-tags"].latest;
    return {
        version: latest,
        releaseDate: pkgInfo.time[latest] ?? `unknown`
    };
}
function getMaxSatisfyingVersion(pkgInfo, version) {
    const versions = [...Object.keys(pkgInfo.versions)];
    const maxSatisfying = semver.maxSatisfying(versions, version);
    if (maxSatisfying === null)
        throw new Error(`Couldn't find a version match`);
    return maxSatisfying;
}
function getReleaseDate(pkgInfo, version) {
    const releaseDate = pkgInfo.time[version];
    if (typeof releaseDate === "undefined")
        throw new Error(`Couldn't find a release date for ${pkgInfo.name}@${version}`);
    return releaseDate;
}
async function getNpmPackage(name, provider) {
    const pkgInfo = await provider.getPackageMetadata(name);
    if (typeof pkgInfo === "undefined" || (0, npm_1.isUnpublished)(pkgInfo))
        throw new Error(`Couldn't get data`);
    return pkgInfo;
}
async function updateCheck(name, version, provider) {
    const pkgInfo = await getNpmPackage(name, provider);
    const maxSatisfying = getMaxSatisfyingVersion(pkgInfo, version);
    const releaseDate = getReleaseDate(pkgInfo, maxSatisfying);
    return {
        version: maxSatisfying,
        releaseDate: releaseDate
    };
}
exports.updateCheck = updateCheck;
async function updateInfo(name, version, provider) {
    const bugfixVersionString = getBugfixVersionString(version);
    const minorVersionString = getMinorVersionString(version);
    const pkgInfo = await getNpmPackage(name, provider);
    const semVerUpdate = await updateCheck(name, version, provider);
    const bugfixUpdate = await updateCheck(name, bugfixVersionString, provider);
    const minorUpdate = await updateCheck(name, minorVersionString, provider);
    const latestUpdate = latestVersion(pkgInfo);
    return {
        name,
        version,
        latestOverall: latestUpdate,
        latestSemanticMatch: semVerUpdate,
        latestBugfix: bugfixUpdate,
        latestMinor: minorUpdate
    };
}
exports.updateInfo = updateInfo;
//# sourceMappingURL=update.js.map