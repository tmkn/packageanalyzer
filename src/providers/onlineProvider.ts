import * as semver from "semver";

import { IPackageProvider } from "./folderProvider";
import { INpmPackageInfo, INpmPackage, PackageVersion } from "../npm";
import { downloadHttpJson } from "../requests";

//loads npm data from the web
export class OnlinePackageProvider implements IPackageProvider {
    private readonly _cache: Map<string, INpmPackageInfo> = new Map();

    constructor(private _url: string, private _max = 3) {}

    /*setMaxConcurrent(newMax: number): void {
        this._max = newMax;
    }*/

    get size(): number {
        let size = 0;

        for (let [, info] of this._cache) {
            size += Object.keys(info.versions).length;
        }

        return size;
    }

    async getPackageInfo(name: string): Promise<INpmPackageInfo | null> {
        const cachedInfo = this._cache.get(name);

        if (typeof cachedInfo !== "undefined") {
            return cachedInfo;
        } else {
            console.log(`Fetching ${name}`);

            let data = await downloadHttpJson<INpmPackageInfo>(
                `${this._url}/${encodeURIComponent(name)}`
            );

            return data;
        }
    }

    async *getPackagesByVersion(modules: PackageVersion[]): AsyncIterableIterator<INpmPackage[]> {
        for (let i = 0; i < modules.length; i = i + this._max) {
            let chunk = modules.slice(i, i + this._max);
            let promises = chunk.map(([name, version]) => this.getPackageByVersion(name, version));

            yield await Promise.all([...promises]);
        }
    }

    async getPackageByVersion(
        name: string,
        version: string | undefined = undefined
    ): Promise<INpmPackage> {
        let info: INpmPackageInfo | null;

        if (this._cache.has(name)) {
            info = this._cache.get(name)!;
        } else {
            info = await this.getPackageInfo(name);

            if (!info) {
                let _version: string = typeof version !== "undefined" ? `@${version}` : ``;
                throw `Couldn't get package "${name}${_version}"`;
            }

            this._cache.set(name, info);
        }

        let allVersions: string[] = Object.keys(info.versions);
        const versionToResolve =
            typeof version !== "undefined" ? version : info["dist-tags"].latest;
        let resolvedVersion: string | null = semver.maxSatisfying(allVersions, versionToResolve);

        if (resolvedVersion === null) {
            throw new Error(`Couldn't resolve version ${version} for "${name}"`);
        }

        return info.versions[resolvedVersion];
    }
}

export const npmOnline = new OnlinePackageProvider(`http://registry.npmjs.com`);
