import { INpmPackage } from "./npm";

export type LicenseSummary = Map<string /*name*/, Map<string /*version*/, string /*license*/>>;
export type VersionSummary = Map<string /*name*/, Set<string> /*versions*/>;

//statistics that need internet as that info is not available locally
interface IAsyncPackageStatistics {
    size: number;
    oldestPackage: PackageAnalytics; //npm show ${name} time
    newestPackage: PackageAnalytics;
    timeSpan: number; //time between oldest and newest package
}

interface IPackageStatistics {
    all: PackageAnalytics[];
    transitiveDependenciesCount: number;
    distinctByNameCount: number;
    distinctByVersionCount: number;
    path: Array<[string, string]>;
    mostReferred: [string, number];
    mostDependencies: PackageAnalytics;
    mostVersions: VersionSummary;
    loops: PackageAnalytics[];
    licenses: LicenseSummary;
    async?: IAsyncPackageStatistics;
}

export class PackageAnalytics implements IPackageStatistics {
    parent: PackageAnalytics | null = null;
    isLoop: boolean = false;
    private readonly _dependencies: PackageAnalytics[] = [];

    constructor(private readonly _data: Readonly<INpmPackage>) {}

    get name(): string {
        return this._data.name;
    }

    get version(): string {
        return this._data.version;
    }

    get fullName(): string {
        return `${this.name}@${this.version}`;
    }

    published: Date | undefined;
    get oldest(): PackageAnalytics | undefined {
        let oldest: PackageAnalytics | undefined = undefined;

        if (this.published) oldest = this;

        this.visit(d => {
            if (oldest) {
                if (d.published && oldest.published) {
                    if (d.published < oldest.published) oldest = d;
                }
            } else {
                if (d.published) oldest = d;
            }
        }, false);

        return oldest;
    }

    get newest(): PackageAnalytics | undefined {
        let newest: PackageAnalytics | undefined = undefined;

        if (this.published) newest = this;

        this.visit(d => {
            if (newest) {
                if (d.published && newest.published) {
                    if (d.published > newest.published) newest = d;
                }
            } else {
                if (d.published) newest = d;
            }
        }, false);

        return newest;
    }

    get license(): string {
        if (typeof this._data.license !== "undefined") return this._data.license;
        else if (typeof this._data.licenses !== "undefined")
            return this._data.licenses.map(l => l.type).join(",");
        else {
            return `No license found for ${this.fullName}`;
        }
    }

    get directDependencyCount(): number {
        return this._dependencies.length;
    }

    getData<T extends keyof INpmPackage = keyof INpmPackage>(key: T): INpmPackage[T] {
        return this._data[key];
    }

    addDependency(dependency: PackageAnalytics): void {
        dependency.parent = this;

        this._dependencies.push(dependency);
    }

    visit(
        callback: (dependency: PackageAnalytics) => void,
        includeSelf = false,
        start: PackageAnalytics = this
    ): void {
        if (includeSelf) callback(this);

        for (let child of start._dependencies) {
            callback(child);
            this.visit(callback, false, child);
        }
    }

    getPackagesBy(filter: (pkg: PackageAnalytics) => boolean): PackageAnalytics[] {
        let matches: PackageAnalytics[] = [];

        this.visit(
            d => {
                if (filter(d)) matches.push(d);
            },
            true,
            this
        );

        return matches;
    }

    getPackagesByName(name: string, version?: string): PackageAnalytics[] {
        let matches: PackageAnalytics[] = [];

        this.visit(d => {
            if (typeof version === "undefined") {
                if (d.name === name) matches.push(d);
            } else {
                if (d.name === name && d.version === version) matches.push(d);
            }
        }, true);

        return matches;
    }

    getPackageByName(name: string, version?: string): PackageAnalytics | null {
        let matches: PackageAnalytics[] = this.getPackagesByName(name, version);

        if (matches.length > 0) return matches[0];

        return null;
    }

    get transitiveDependenciesCount(): number {
        let count = 0;

        this.visit(d => count++);

        return count;
    }

    get licenses(): LicenseSummary {
        let licenseMap: LicenseSummary = new Map();

        this.visit(d => {
            let packageKey = licenseMap.get(d.name);

            if (!packageKey) {
                licenseMap.set(d.name, new Map([[d.version, d.license]]));
            } else {
                packageKey.set(d.version, d.license);
            }
        }, true);

        return licenseMap;
    }

    get sorted(): Map<string, Map<string, PackageAnalytics>> {
        let sorted: Map<string, Map<string, PackageAnalytics>> = new Map();

        this.visit(d => {
            let packageName = sorted.get(d.name);

            if (packageName) {
                packageName.set(d.version, d);
            } else {
                sorted.set(d.name, new Map([[d.version, d]]));
            }
        }, true);

        return sorted;
    }

    //todo possible multiple matches
    get mostDependencies(): PackageAnalytics {
        let most: PackageAnalytics = this;

        this.visit(d => {
            if (most._dependencies.length < d._dependencies.length) {
                most = d;
            }
        });

        return most;
    }

    //todo possible multiple matches
    get mostReferred(): [string, number] {
        let mostReferred: Map<string, number> = new Map();
        let max = 0;
        let name = "";

        this.visit(d => {
            let entry = mostReferred.get(d.name);

            if (entry) {
                mostReferred.set(d.name, entry + 1);
            } else {
                mostReferred.set(d.name, 1);
            }
        }, true);

        for (const [pkgName, count] of mostReferred) {
            if (count > max) {
                max = count;
                name = pkgName;
            }
        }

        return [name, max];
    }

    get mostVersions(): VersionSummary {
        let max = 0;
        let map: VersionSummary = new Map();

        for (const [name, versions] of this.sorted) {
            if (versions.size > max) {
                max = versions.size;
                map = new Map([[name, new Set(versions.keys())]]);
            } else if (max === versions.size) {
                map.set(name, new Set(versions.keys()));
            }
        }

        return map;
    }

    get cost(): number {
        let cost = 0;

        this.visit(d => {
            const dist = d.getData("dist");

            if (typeof dist !== "undefined") {
                cost += dist.unpackedSize ? dist.unpackedSize : 0;
            } else console.log(`${d.fullName} doesn't contain a dist key`);
        }, true);

        return cost;
    }

    get path(): Array<[string, string]> {
        const path: Array<[string, string]> = [];
        let current: PackageAnalytics | null = this;

        while (current.parent !== null) {
            path.push([current.name, current.version]);

            current = current.parent;
        }

        path.push([current.name, current.version]);

        return path.reverse();
    }

    get pathString(): string {
        let levels: string[] = [];

        for (let [name, version] of this.path) {
            levels.push(`${name}@${version}`);
        }

        return levels.join(" -> ");
    }

    get all(): PackageAnalytics[] {
        let all: PackageAnalytics[] = [];

        this.visit(d => all.push(d), true);

        return all;
    }

    get loops(): PackageAnalytics[] {
        let loops: PackageAnalytics[] = [];

        this.visit(d => {
            if (d.isLoop) loops.push(d);
        }, true);

        return loops;
    }

    get distinctByNameCount(): number {
        let packageNames: Set<string> = new Set();

        this.visit(d => packageNames.add(d.name));

        return packageNames.size;
    }

    get distinctByVersionCount(): number {
        let packageNames: Set<string> = new Set();

        this.visit(d => packageNames.add(d.fullName));

        return packageNames.size;
    }
}

export function getNameAndVersion(name: string): [string, string?] {
    if (name.startsWith(`@`)) {
        const parts = name.slice(1).split("@");

        if (parts.length === 1) {
            return [`@${parts[0]}`, undefined];
        } else if (parts.length === 2) {
            if (parts[1].trim() !== "") return [`@${parts[0]}`, parts[1]];
        }

        throw `Unable to determine version from "${name}"`;
    } else {
        const parts = name.split("@");

        if (parts.length === 1) {
            return [`${parts[0]}`, undefined];
        } else if (parts.length === 2) {
            if (parts[1].trim() !== "") return [`${parts[0]}`, parts[1]];
        }

        throw `Unable to determine version from "${name}"`;
    }
}

export function groupPackagesByLicense(
    licenses: LicenseSummary
): Array<{ license: string; names: string[] }> {
    let sorted: Map<string, Set<string>> = new Map();
    const grouped: Array<{ license: string; names: string[] }> = [];

    for (const [name, versions] of licenses) {
        for (const license of versions.values()) {
            let entry = sorted.get(license);

            if (entry) {
                entry.add(name);
            } else {
                sorted.set(license, new Set([name]));
            }
        }
    }

    for (const [license, names] of sorted) {
        sorted.set(license, new Set([...names.values()].sort()));

        grouped.push({
            license: license,
            names: [...new Set([...names.values()].sort())]
        });
    }

    return grouped.sort((a, b) => b.names.length - a.names.length);
}
