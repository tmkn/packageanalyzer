import { Writable } from "stream";
import { ExtensionData, IDataExtension, IStaticDataExtension } from "../extensions/extension";
import { INpmPackageVersion, IMalformedLicenseField } from "../npm";
import { ITreeFormatter, print } from "../tree";

type Name = string;
type Version = string;
type License = string;

export type LicenseSummary = Map<Name, Map<Version, License>>;
export type GroupedLicenseSummary = Array<{ license: string; names: string[] }>;
export type VersionSummary = Map<Name, Set<Version>>;

interface IDeprecatedInfo {
    deprecated: boolean;
    message: string;
}

interface IPackageStatistics {
    all: Package[];
    transitiveDependenciesCount: number;
    distinctByNameCount: number;
    distinctByVersionCount: number;
    path: Array<[string, string]>;
    mostReferred: [string, number];
    mostDependencies: Package;
    mostVersions: VersionSummary;
    loops: Package[];
    licenses: LicenseSummary;
    licensesByGroup: GroupedLicenseSummary;
    timeSpan: number | undefined;
    size: number | undefined;
    directDependencies: Package[];
    printDependencyTree(stdout: Writable): void;
    getExtensionData<T extends IStaticDataExtension<any, []>>(extension: T): ExtensionData<T>;
    addExtensionData(extension: IDataExtension<any>): Promise<void>;
}

export class Package implements IPackageStatistics {
    parent: Package | null = null;
    isLoop = false;
    private _extensionData: Map<Symbol, any> = new Map();
    private readonly _dependencies: Package[] = [];

    constructor(private readonly _data: Readonly<INpmPackageVersion>) {}

    get name(): string {
        return this._data.name;
    }

    get version(): string {
        return this._data.version;
    }

    get fullName(): string {
        return `${this.name}@${this.version}`;
    }

    get timeSpan(): number | undefined {
        throw new Error("Not Implemented");
    }

    get size(): number | undefined {
        throw new Error("Not Implemented");
    }

    get license(): string {
        try {
            const { license } = this._data;

            //check if license field is set
            if (typeof license !== "undefined") {
                if (typeof license === "string") {
                    return license;
                } else if (this._isLicenseObject(license)) {
                    return license.type;
                } else {
                    return JSON.stringify(license);
                }
                //fallback to licenses field
            } else if (typeof this._data.licenses !== "undefined")
                return this._data.licenses.map(l => l.type).join(",");
            //weird format | not set -> fail
            else {
                throw new Error(`Unable to parse license`);
            }
        } catch {
            return `PARSE ERROR: ${this.fullName}`;
        }
    }

    //even though license should be string some packages contain json objects...
    private _isLicenseObject(data: unknown): data is IMalformedLicenseField {
        if (typeof data === "object" && data !== null) {
            return "type" in data && "url" in data;
        }

        return false;
    }

    get directDependencyCount(): number {
        return this._dependencies.length;
    }

    get deprecatedInfo(): IDeprecatedInfo {
        const { deprecated } = this._data;

        if (deprecated) {
            return {
                deprecated: true,
                message: deprecated
            };
        }

        return {
            deprecated: false,
            message: ``
        };
    }

    getData<T extends keyof INpmPackageVersion = keyof INpmPackageVersion>(
        key: T
    ): INpmPackageVersion[T] {
        return this._data[key];
    }

    addDependency(dependency: Package): void {
        dependency.parent = this;

        this._dependencies.push(dependency);
    }

    visit(
        callback: (dependency: Package) => void,
        includeSelf = false,
        start: Package = this
    ): void {
        if (includeSelf) callback(this);

        for (const child of start._dependencies) {
            callback(child);
            this.visit(callback, false, child);
        }
    }

    getPackagesBy(filter: (pkg: Package) => boolean): Package[] {
        const matches: Package[] = [];

        this.visit(
            d => {
                if (filter(d)) matches.push(d);
            },
            true,
            this
        );

        return matches;
    }

    getPackagesByName(name: string, version?: string): Package[] {
        const matches: Package[] = [];

        this.visit(d => {
            if (typeof version === "undefined") {
                if (d.name === name) matches.push(d);
            } else {
                if (d.name === name && d.version === version) matches.push(d);
            }
        }, true);

        return matches;
    }

    getPackageByName(name: string, version?: string): Package | null {
        const matches: Package[] = this.getPackagesByName(name, version);

        if (matches.length > 0) return matches[0];

        return null;
    }

    get transitiveDependenciesCount(): number {
        let count = 0;

        this.visit(() => count++);

        return count;
    }

    get licenses(): LicenseSummary {
        const licenseMap: LicenseSummary = new Map();

        this.visit(d => {
            const packageKey = licenseMap.get(d.name);

            if (!packageKey) {
                licenseMap.set(d.name, new Map([[d.version, d.license]]));
            } else {
                packageKey.set(d.version, d.license);
            }
        }, true);

        return licenseMap;
    }

    get licensesByGroup(): GroupedLicenseSummary {
        const licenses = this.licenses;
        const sorted: Map<string, Set<string>> = new Map();
        const grouped: GroupedLicenseSummary = [];

        for (const [name, versions] of licenses) {
            for (const license of versions.values()) {
                const entry = sorted.get(license);

                if (entry) {
                    entry.add(name);
                } else {
                    sorted.set(license, new Set([name]));
                }
            }
        }

        for (const [license, names] of sorted) {
            grouped.push({
                license: license,
                names: [...new Set([...names.values()].sort())]
            });
        }

        return grouped.sort((a, b) => b.names.length - a.names.length);
    }

    get sorted(): Map<string, Map<string, Package>> {
        const sorted: Map<string, Map<string, Package>> = new Map();

        this.visit(d => {
            const packageName = sorted.get(d.name);

            if (packageName) {
                packageName.set(d.version, d);
            } else {
                sorted.set(d.name, new Map([[d.version, d]]));
            }
        }, true);

        return sorted;
    }

    //todo possible multiple matches
    get mostDependencies(): Package {
        let most: Package = this;

        this.visit(d => {
            if (most._dependencies.length < d._dependencies.length) {
                most = d;
            }
        });

        return most;
    }

    //todo possible multiple matches
    get mostReferred(): [string, number] {
        const mostReferred: Map<string, number> = new Map();
        let max = 0;
        let name = "";

        this.visit(d => {
            const entry = mostReferred.get(d.name);

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

            if (dist?.unpackedSize) {
                cost += dist.unpackedSize;
            }
        }, true);

        return cost;
    }

    get path(): Array<[string, string]> {
        const path: Array<[string, string]> = [];
        let current: Package | null = this;

        while (current.parent !== null) {
            path.push([current.name, current.version]);

            current = current.parent;
        }

        path.push([current.name, current.version]);

        return path.reverse();
    }

    get pathString(): string {
        const levels: string[] = [];

        for (const [name, version] of this.path) {
            levels.push(`${name}@${version}`);
        }

        return levels.join(" → ");
    }

    get all(): Package[] {
        const all: Package[] = [];

        this.visit(d => all.push(d), true);

        return all;
    }

    get loops(): Package[] {
        const loops: Package[] = [];

        this.visit(d => {
            if (d.isLoop) loops.push(d);
        }, true);

        return loops;
    }

    //returns the loop path e.g. c->d->c instead of the whole path a->b->c->d->c
    get loopPathString(): string {
        const split = this.pathString.indexOf(this.fullName);

        return this.pathString.slice(split);
    }

    get loopPathMap(): ReadonlyMap<string, Set<string>> {
        const map: Map<string, Set<string>> = new Map();
        const loops = this.loops;

        for (const loop of loops) {
            const entry = map.get(loop.name);

            if (entry) {
                entry.add(loop.loopPathString);
            } else {
                map.set(loop.name, new Set([loop.loopPathString]));
            }
        }

        return map;
    }

    get distinctLoopCount(): number {
        return [...this.loopPathMap].reduce((i, [, loops]) => i + loops.size, 0);
    }

    get distinctByNameCount(): number {
        const packageNames: Set<string> = new Set();

        this.visit(d => packageNames.add(d.name));

        return packageNames.size;
    }

    get distinctByVersionCount(): number {
        const packageNames: Set<string> = new Set();

        this.visit(d => packageNames.add(d.fullName));

        return packageNames.size;
    }

    get directDependencies(): Package[] {
        const depth = this.path.length;

        return this.getPackagesBy(pkg => pkg.path.length === depth + 1);
    }

    printDependencyTree(stdout: Writable): void {
        const converter: ITreeFormatter<Package> = {
            getLabel: data => `${data.fullName} (${data.transitiveDependenciesCount} dependencies)`,
            getChildren: data => data.directDependencies
        };

        print<Package>(this, converter, stdout);
    }

    getExtensionData<T extends IStaticDataExtension<any, any[]>>(extension: T): ExtensionData<T> {
        const data = this._extensionData.get(extension.key);

        if (typeof data === "undefined") {
            throw new Error(`No extension data found for ${extension.toString()}`);
        }

        return data;
    }

    async addExtensionData(extension: IDataExtension<any>): Promise<void> {
        const data = await extension.apply(this);

        this._extensionData.set(extension.key, data);
    }
}
