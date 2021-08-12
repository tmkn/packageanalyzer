import * as semver from "semver";

import { IPackageMetadata, IPackageJson, IUnpublishedPackageMetadata, isUnpublished } from "../npm";
import { downloadHttpJson } from "../utils/requests";
import { PackageVersion } from "../visitors/visitor";
import { IPackageJsonProvider, IPackageMetaDataProvider } from "./provider";

//loads npm data from the web
export class OnlinePackageProvider implements IPackageJsonProvider, IPackageMetaDataProvider {
    private readonly _cache: Map<string, IPackageMetadata> = new Map();

    constructor(private _url: string) {}

    async getPackageMetadata(
        name: string
    ): Promise<IPackageMetadata | IUnpublishedPackageMetadata | undefined> {
        const cachedInfo = this._cache.get(name);

        if (typeof cachedInfo !== "undefined") {
            return cachedInfo;
        } else {
            const data = await downloadHttpJson<IPackageMetadata>(
                `${this._url}/${encodeURIComponent(name)}`
            );

            return data === null ? undefined : data;
        }
    }

    async *getPackageJsons(modules: PackageVersion[]): AsyncIterableIterator<IPackageJson> {
        for (const [name, version] of modules) {
            yield this.getPackageJson(name, version);
        }
    }

    async getPackageJson(
        name: string,
        version: string | undefined = undefined
    ): Promise<IPackageJson> {
        let info: IPackageMetadata | IUnpublishedPackageMetadata | undefined =
            this._cache.get(name);

        if (!info) {
            info = await this.getPackageMetadata(name);

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

        const packageJson = info.versions[resolvedVersion];

        if(!packageJson)
            throw new Error(`No package.json found for version ${resolvedVersion} for ${name}`);

        return packageJson;
    }
}

export const npmOnline = new OnlinePackageProvider(`http://registry.npmjs.com`);
