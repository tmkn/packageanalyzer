import * as crypto from "crypto";
import * as path from "path";
import * as fs from "fs";

import { IPackageVersionProvider } from "./folder";
import { INpmPackageVersion, PackageVersion, INpmPackage, INpmDumpRow } from "../npm";
import * as semver from "semver";

//load data from a folder where the filename is the sha1 hash of the package name
export class FlatFolderProvider implements IPackageVersionProvider {
    get size(): number {
        return -1;
    }

    constructor(private _folder: string) {}

    private _getSHA1Filename(name: string): string {
        const sha1 = crypto.createHash("sha1");
        sha1.update(name);

        return `${sha1.digest("hex")}.json`;
    }

    async getPackageByVersion(name: string, version?: string): Promise<INpmPackageVersion> {
        const packagePath = path.join(this._folder, this._getSHA1Filename(name));

        if (!fs.existsSync(packagePath)) throw new Error(`Couldn't find package "${name}"`);

        const dump: INpmDumpRow = JSON.parse(fs.readFileSync(packagePath, "utf8"));
        const packageInfo: INpmPackage = dump.doc;
        const availableVersions: string[] = [...Object.keys(packageInfo.versions)];

        if (typeof version === "undefined") {
            const latestVersion = packageInfo["dist-tags"].latest;

            if (typeof packageInfo.versions[latestVersion] === "undefined")
                throw new Error(`Error extracting latest package ${name}@${latestVersion}`);

            return packageInfo.versions[latestVersion];
        } else {
            const resolvedVersion = semver.maxSatisfying(availableVersions, version);

            if (resolvedVersion === null) {
                throw new Error(`Couldn't resolve ${version} for ${name}`);
            }

            return packageInfo.versions[resolvedVersion];
        }
    }

    async *getPackagesByVersion(
        modules: PackageVersion[]
    ): AsyncIterableIterator<INpmPackageVersion> {
        for (const [name, version] of modules) {
            yield this.getPackageByVersion(name, version);
        }
    }
}
