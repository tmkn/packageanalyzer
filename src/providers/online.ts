import * as semver from "semver";

import { IPackageProvider } from "./folder";
import {
    INpmPackageInfo,
    INpmPackage,
    PackageVersion,
    IUnpublishedNpmPackage,
    isUnpublished
} from "../npm";
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

        for (const [, info] of this._cache) {
            size += Object.keys(info.versions).length;
        }

        return size;
    }

    async getPackageInfo(name: string): Promise<INpmPackageInfo | IUnpublishedNpmPackage | null> {
        const cachedInfo = this._cache.get(name);

        if (typeof cachedInfo !== "undefined") {
            return cachedInfo;
        } else {
            const data = await downloadHttpJson<INpmPackageInfo>(
                `${this._url}/${encodeURIComponent(name)}`
            );

            return data;
        }
    }

    async *getPackagesByVersion(modules: PackageVersion[]): AsyncIterableIterator<INpmPackage[]> {
        for (let i = 0; i < modules.length; i = i + this._max) {
            const chunk = modules.slice(i, i + this._max);
            const promises = chunk.map(([name, version]) =>
                this.getPackageByVersion(name, version)
            );

            yield await Promise.all([...promises]);
        }
    }

    async getPackageByVersion(
        name: string,
        version: string | undefined = undefined
    ): Promise<INpmPackage> {
        let info: INpmPackageInfo | IUnpublishedNpmPackage | undefined | null = this._cache.get(
            name
        );

        if (!info) {
            info = await this.getPackageInfo(name);

            if (!info) {
                const _version: string = typeof version !== "undefined" ? `@${version}` : ``;
                throw `Couldn't get package "${name}${_version}"`;
            }

            if (isUnpublished(info)) {
                throw `Package "${name}" was unpublished`;
            }

            this._cache.set(name, info);
        }

        const allVersions: string[] = Object.keys(info.versions);
        const versionToResolve =
            typeof version !== "undefined" ? version : info["dist-tags"].latest;
        const resolvedVersion: string | null = semver.maxSatisfying(allVersions, versionToResolve);

        if (resolvedVersion === null) {
            throw new Error(`Couldn't resolve version ${version} for "${name}"`);
        }

        return info.versions[resolvedVersion];
    }
}

export const npmOnline = new OnlinePackageProvider(`http://registry.npmjs.com`);
