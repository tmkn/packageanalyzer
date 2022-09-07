import * as semver from "semver";

import { IPackageMetadata, IPackageJson, IUnpublishedPackageMetadata, isUnpublished } from "../npm";
import { PackageVersion } from "../visitors/visitor";

export interface IPackageMetaDataProvider {
    getPackageMetadata(
        name: string
    ): Promise<IPackageMetadata | IUnpublishedPackageMetadata | undefined>;
}

//loads npm data from a folder
export interface IPackageJsonProvider {
    //load version specific data, loads latest version if no version is specified
    getPackageJson: (...args: PackageVersion) => Promise<IPackageJson>;
}

export abstract class AbstractPackageProvider
    implements IPackageJsonProvider, IPackageMetaDataProvider
{
    protected readonly _cache: Map<string, IPackageMetadata> = new Map();

    abstract getPackageMetadata(
        name: string
    ): Promise<IPackageMetadata | IUnpublishedPackageMetadata | undefined>;

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

        if (!packageJson)
            throw new Error(`No package.json found for version ${resolvedVersion} for ${name}`);

        return packageJson;
    }
}
