import {
    DataExtensionType,
    IDataExtension,
    IDataExtensionStatic
} from "../extensions/data/DataExtension";
import { INpmPackageVersion, IMalformedLicenseField } from "../npm";

type Name = string;
type Version = string;

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
    mostReferred: [string, number];
    mostDependencies: Package;
    mostVersions: VersionSummary;
    directDependencies: Package[];
    getExtensionData<T extends IDataExtensionStatic<any, []>>(extension: T): DataExtensionType<T>;
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

    get all(): Package[] {
        const all: Package[] = [];

        this.visit(d => all.push(d), true);

        return all;
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
        return this._dependencies;
    }

    getExtensionData<T extends IDataExtensionStatic<any, any[]>>(
        extension: T
    ): DataExtensionType<T> {
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
