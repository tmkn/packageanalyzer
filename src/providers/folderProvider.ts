import * as path from "path";
import * as fs from "fs";
import * as semver from "semver";

import { PackageVersion, INpmPackage } from "../npm";

//loads npm data from a folder
export interface IPackageProvider {
    //load version specific data, loads latest version if no version is specified
    size: number;
    getPackageByVersion: (name: string, version?: string) => Promise<INpmPackage>;
    getPackagesByVersion: (modules: PackageVersion[]) => AsyncIterableIterator<INpmPackage[]>;
}

//gathers packages from a node_modules folder
export class NodeModulesProvider implements IPackageProvider {
    private _paths: Set<string> = new Set();
    private readonly _cache: Map<string, Map<string, INpmPackage>> = new Map();

    constructor(_folder: string) {
        let matches = this._findPackageJson(_folder);

        this._paths = new Set(matches.sort());
        this._load();
    }

    private _findPackageJson(folder: string): string[] {
        try {
            let pkgs: string[] = [];

            let folderEntries = fs
                .readdirSync(folder, "utf8")
                .map(entry => path.join(folder, entry));

            for (let entry of folderEntries) {
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
        let failedPaths: string[] = [];

        for (let pkgPath of this._paths) {
            try {
                let content = fs.readFileSync(pkgPath, "utf8");
                let pkg: INpmPackage = JSON.parse(content);

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

        for (let [name, versions] of this._cache) {
            for (let [version, pkg] of versions) {
                size++;
            }
        }

        return size;
    }

    addPackage(pkg: INpmPackage): void {
        let { name, version } = pkg;
        let versions = this._cache.get(name);

        if (typeof versions === "undefined") {
            this._cache.set(name, new Map([[version, pkg]]));
        } else {
            let specificVersion = versions.get(version);

            if (typeof specificVersion === "undefined") {
                versions.set(version, pkg);
            }
        }
    }

    async *getPackagesByVersion(modules: PackageVersion[]): AsyncIterableIterator<INpmPackage[]> {
        let packages: INpmPackage[] = [];

        for (const pkgVersion of modules) {
            packages.push(await this.getPackageByVersion(...pkgVersion));
        }

        yield packages;
    }

    async getPackageByVersion(name: string, version?: string | undefined): Promise<INpmPackage> {
        let versions = this._cache.get(name);
        let pkg: INpmPackage;

        if (typeof versions === "undefined") {
            throw `Couldn't find package ${name}`;
        }

        //load latest available version
        if (typeof version === "undefined") {
            let [latestVersion] = [...versions.keys()].slice(-1);
            let specificVersion = versions.get(latestVersion);

            //should never happen..
            if (typeof specificVersion === "undefined")
                throw `Error extracting latest package ${name}@${version}`;

            pkg = specificVersion;
        } else {
            let availableVersions: string[] = [...versions.keys()];
            let resolvedVersion = semver.maxSatisfying(availableVersions, version);

            if (resolvedVersion === null) {
                throw `Couldn't resolve ${version} for ${name}`;
            }

            let specificVersion = versions.get(resolvedVersion);

            if (typeof specificVersion === "undefined")
                throw `Couldn't find package ${name}@${version}`;

            pkg = specificVersion;
        }

        return pkg;
    }
}
