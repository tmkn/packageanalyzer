import * as semver from "semver";

import { IPackageProvider } from "./folderProvider";
import { INpmPackageInfo, INpmPackage, PackageVersion } from "../npm";
import { downloadHttpJson } from "../requests";

//loads npm data from the web
export class OnlinePackageProvider implements IPackageProvider {
    private readonly _cache: Map<string, INpmPackageInfo> = new Map();

    constructor(private _url: string, private _max = 3) {}

    setMaxConcurrent(newMax: number): void {
        this._max = newMax;
    }

    get size(): number {
        let size = 0;

        for (let [, info] of this._cache) {
            size += Object.keys(info.versions).length;
        }

        return size;
    }

    private async _getModuleInfo(name: string): Promise<INpmPackageInfo | null> {
        console.log(`Fetching ${name}`);

        let data = await downloadHttpJson<INpmPackageInfo>(
            `${this._url}/${encodeURIComponent(name)}`
        );

        /*if (data === null) {
            throw new Error(`Server didn't respond/returned wrong format for ${name}`);
        }*/

        return data;
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
            info = await this._getModuleInfo(name);

            if (!info) {
                let _version: string = typeof version !== "undefined" ? `@${version}` : ``;
                throw `Couldn't get package "${name}${_version}"`;
            }

            this._cache.set(name, info);
        }

        let versions: string[] = Object.keys(info.versions);
        let resolvedVersion: string | null = semver.maxSatisfying(
            versions,
            typeof version !== "undefined" ? version : info["dist-tags"].latest
        );

        if (resolvedVersion === null) {
            throw new Error(`Couldn't resolve version ${version} for "${name}"`);
        }

        return info.versions[resolvedVersion];
    }
}

export const npmOnline = new OnlinePackageProvider(`http://registry.npmjs.com`);
