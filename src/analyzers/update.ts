import * as semver from "semver";
import { PackageVersion } from "../npm";

//check a package for updates todo
export async function checkForUpdate(version: string): Promise<string> {
    throw new Error(`not implemented`);
}

interface IUpdateResult {
    name: string;
    version: string;
    latest: string;
    latestSemanticMatch: string;
    latestBugfixMatch: string;
}

type PackageWithVersion = [string, string];

interface IUpdateAnalyzer {
    checkPackage: (module: PackageWithVersion) => Promise<IUpdateResult>;
    checkPackages: (modules: PackageWithVersion[]) => AsyncIterableIterator<IUpdateResult>;
}