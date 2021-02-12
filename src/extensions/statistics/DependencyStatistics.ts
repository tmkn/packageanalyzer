import { Package } from "../../analyzers/package";

type Name = string;
type Version = string;

export type VersionSummary = Map<Name, Set<Version>>;

export class DependencyStatistics {
    constructor(private _p: Package) {}

    get transitiveDependenciesCount(): number {
        let count = 0;

        this._p.visit(() => count++);

        return count;
    }

    get distinctByNameCount(): number {
        const packageNames: Set<string> = new Set();

        this._p.visit(d => packageNames.add(d.name));

        return packageNames.size;
    }

    get distinctByVersionCount(): number {
        const packageNames: Set<string> = new Set();

        this._p.visit(d => packageNames.add(d.fullName));

        return packageNames.size;
    }

    //todo possible multiple matches
    get mostReferred(): [string, number] {
        const mostReferred: Map<string, number> = new Map();
        let max = 0;
        let name = "";

        this._p.visit(d => {
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

    //todo possible multiple matches
    get mostDependencies(): Package {
        let most: Package = this._p;

        this._p.visit(d => {
            if (most.directDependencies.length < d.directDependencies.length) {
                most = d;
            }
        });

        return most;
    }

    get all(): Package[] {
        const all: Package[] = [];

        this._p.visit(d => all.push(d), true);

        return all;
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

    get sorted(): Map<string, Map<string, Package>> {
        const sorted: Map<string, Map<string, Package>> = new Map();

        this._p.visit(d => {
            const packageName = sorted.get(d.name);

            if (packageName) {
                packageName.set(d.version, d);
            } else {
                sorted.set(d.name, new Map([[d.version, d]]));
            }
        }, true);

        return sorted;
    }
}
