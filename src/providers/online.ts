import * as semver from "semver";

import { IPackageVersionProvider } from "./folder";
import { INpmPackage, INpmPackageVersion, IUnpublishedNpmPackage, isUnpublished } from "../npm";
import { downloadHttpJson } from "../utils/requests";
import { PackageVersion } from "../visitors/visitor";

//loads npm data from the web
export class OnlinePackageProvider implements IPackageVersionProvider {
    private readonly _cache: Map<string, INpmPackage> = new Map();

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

    async getPackageInfo(name: string): Promise<INpmPackage | IUnpublishedNpmPackage | undefined> {
        const cachedInfo = this._cache.get(name);

        if (typeof cachedInfo !== "undefined") {
            return cachedInfo;
        } else {
            const data = await downloadHttpJson<INpmPackage>(
                `${this._url}/${encodeURIComponent(name)}`
            );

            return data === null ? undefined : data;
        }
    }

    async *getPackagesByVersion(
        modules: PackageVersion[]
    ): AsyncIterableIterator<INpmPackageVersion> {
        for (const [name, version] of modules) {
            yield this.getPackageByVersion(name, version);
        }
    }

    async getPackageByVersion(
        name: string,
        version: string | undefined = undefined
    ): Promise<INpmPackageVersion> {
        let info: INpmPackage | IUnpublishedNpmPackage | undefined = this._cache.get(name);

        if (!info) {
            info = await this.getPackageInfo(name);

            if (!info) {
                const _version: string = typeof version !== "undefined" ? `@${version}` : ``;
                throw new Error(`Couldn't get package "${name}${_version}"`);
            }

            if (isUnpublished(info)) {
                throw new Error(`Package "${name}" was unpublished`);
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
