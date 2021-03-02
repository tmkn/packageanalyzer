import * as path from "path";
import * as fs from "fs";
import * as semver from "semver";

import { INpmPackageVersion, INpmPackage, IUnpublishedNpmPackage } from "../npm";
import { PackageVersion } from "../visitors/visitor";

export interface INpmPackageProvider {
    getPackageInfo(name: string): Promise<INpmPackage | IUnpublishedNpmPackage | undefined>;
}

//loads npm data from a folder
export interface IPackageVersionProvider extends Partial<INpmPackageProvider> {
    //load version specific data, loads latest version if no version is specified
    size: number;
    getPackageByVersion: (name: string, version?: string) => Promise<INpmPackageVersion>;
    getPackagesByVersion: (modules: PackageVersion[]) => AsyncIterableIterator<INpmPackageVersion>;
    //getMainFile: (name: string, version: string) => Promise<string>;
}

//gathers packages from a node_modules folder
export class FileSystemPackageProvider implements IPackageVersionProvider {
    private _paths: Set<string> = new Set();
    private readonly _cache: Map<string, Map<string, INpmPackageVersion>> = new Map();

    constructor(_folder: string) {
        const matches = this._findPackageJson(_folder);

        this._paths = new Set([...matches].sort());
        this._load();
    }

    private _findPackageJson(folder: string): string[] {
        try {
            const pkgs: string[] = [];

            const folderEntries = fs
                .readdirSync(folder, "utf8")
                .map(entry => path.join(folder, entry));

            for (const entry of folderEntries) {
                if (fs.statSync(entry).isDirectory()) {
                    pkgs.push(...this._findPackageJson(entry));
                } else if (entry.endsWith(`package.json`)) {
                    pkgs.push(entry);
                }
            }

            return pkgs;
        } catch (e) {
            console.log(e);

            return [];
        }
    }

    private _load(): void {
        const failedPaths: string[] = [];

        for (const pkgPath of this._paths) {
            try {
                const content = fs.readFileSync(pkgPath, "utf8");
                const pkg: INpmPackageVersion = JSON.parse(content);

                this.addPackage(pkg);
            } catch (e) {
                failedPaths.push(pkgPath);

                continue;
            }
        }

        if (failedPaths.length > 0) {
            console.log(`Failed to load ${failedPaths.length} packages`);
        }
    }

    get size(): number {
        let size = 0;

        for (const [, versions] of this._cache) {
            size += versions.size;
        }

        return size;
    }

    addPackage(pkg: INpmPackageVersion): void {
        const { name, version } = pkg;
        const versions = this._cache.get(name);

        if (typeof versions === "undefined") {
            this._cache.set(name, new Map([[version, pkg]]));
        } else {
            const specificVersion = versions.get(version);

            if (typeof specificVersion === "undefined") {
                versions.set(version, pkg);
            }
        }
    }

    async *getPackagesByVersion(
        modules: PackageVersion[]
    ): AsyncIterableIterator<INpmPackageVersion> {
        for (const pkgVersion of modules) {
            yield this.getPackageByVersion(...pkgVersion);
        }
    }

    async getPackageByVersion(
        name: string,
        version?: string | undefined
    ): Promise<INpmPackageVersion> {
        const versions = this._cache.get(name);
        let pkg: INpmPackageVersion;

        if (typeof versions === "undefined") {
            throw new Error(`Couldn't find package ${name}`);
        }

        //load latest available version
        if (typeof version === "undefined") {
            const [latestVersion] = [...versions.keys()].slice(-1);
            const specificVersion = versions.get(latestVersion);

            //should never happen..
            if (typeof specificVersion === "undefined")
                throw new Error(`Error extracting latest package ${name}@${version}`);

            pkg = specificVersion;
        } else {
            const availableVersions: string[] = [...versions.keys()];
            const resolvedVersion = semver.maxSatisfying(availableVersions, version);

            if (resolvedVersion === null) {
                throw new Error(`Couldn't resolve ${version} for ${name}`);
            }

            const specificVersion = versions.get(resolvedVersion);

            if (typeof specificVersion === "undefined")
                throw new Error(`Couldn't find package ${name}@${version}`);

            pkg = specificVersion;
        }

        return pkg;
    }
}
