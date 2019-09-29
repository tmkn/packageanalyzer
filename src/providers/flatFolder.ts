import * as crypto from "crypto";
import * as path from "path";
import * as fs from "fs";

import { IPackageProvider } from "./folder";
import { INpmPackage, PackageVersion, INpmPackageInfo } from "../npm";
import * as semver from "semver";

//load data from a folder where the filename is the sha1 hash of the package name
export class FlatFolderProvider implements IPackageProvider {
    get size(): number {
        return 0;
    }

    constructor(private _folder: string) {}

    private _getSHA1Filename(name: string): string {
        const sha1 = crypto.createHash("sha1");
        sha1.update(name);

        return `${sha1.digest("hex")}.json`;
    }

    async getPackageByVersion(name: string, version?: string): Promise<INpmPackage> {
        const packagePath = path.join(this._folder, this._getSHA1Filename(name));

        if (!fs.existsSync(packagePath)) throw new Error(`Couldn't find package "${name}"`);

        const packageInfo: INpmPackageInfo = (JSON.parse(fs.readFileSync(packagePath, "utf8"))).doc;
        const availableVersions: string[] = [...Object.keys(packageInfo.versions)];

        if (typeof version === "undefined") {
            const version = packageInfo["dist-tags"].latest;

            if (typeof packageInfo.versions[version] === "undefined")
                throw new Error(`Error extracting latest package ${name}@${version}`);

            return packageInfo.versions[version];
        } else {
            const resolvedVersion = semver.maxSatisfying(availableVersions, version);

            if (resolvedVersion === null) {
                throw new Error(`Couldn't resolve ${version} for ${name}`);
            }

            return packageInfo.versions[resolvedVersion];
        }
    }

    async *getPackagesByVersion(modules: PackageVersion[]): AsyncIterableIterator<INpmPackage[]> {
        const packages: INpmPackage[] = [];

        for (const version of modules) {
            packages.push(await this.getPackageByVersion(...version));
        }

        yield packages;
    }
}
