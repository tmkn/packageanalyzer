import { Package } from "../../package/package";

type Name = string;
type Version = string;

export type VersionSummary = Map<Name, Set<Version>>;

export interface IMostReferred {
    pkgs: string[];
    count: number;
}

//utility functions for the dependency tree
class BaseDependencyUtilities {
    constructor(private _p: Package, private _includeSelf: boolean) {}

    get transitiveCount(): number {
        let count = 0;

        this._p.visit(() => count++, this._includeSelf);

        return count;
    }

    get distinctNameCount(): number {
        return this.distinctNames.size;
    }

    get distinctVersionCount(): number {
        const packageNames: Set<string> = new Set();

        this._p.visit(d => packageNames.add(d.fullName), this._includeSelf);

        return packageNames.size;
    }

    get distinctNames(): Set<Name> {
        const distinct: Set<string> = new Set();

        this._p.visit(d => distinct.add(d.name), this._includeSelf);

        return distinct;
    }

    get mostReferred(): IMostReferred {
        const mostReferred: Map<string, number> = new Map();

        this._p.visit(d => {
            const entry = mostReferred.get(d.name);

            if (entry) {
                mostReferred.set(d.name, entry + 1);
            } else {
                mostReferred.set(d.name, 1);
            }
        }, this._includeSelf);

        let max: number = [...mostReferred.values()].reduce(
            (prev, current) => (current > prev ? current : prev),
            0
        );

        return {
            count: max,
            pkgs: [...mostReferred.entries()]
                .filter(([, count]) => count === max)
                .map(([name]) => name)
        };
    }

    get mostDirectDependencies(): Package[] {
        let most: [first: Package, ...rest: Package[]] = [this._p];

        this._p.visit(d => {
            if (d.directDependencies.length > most[0].directDependencies.length) {
                most = [d];
            } else if (d.directDependencies.length === most[0].directDependencies.length) {
                most.push(d);
            }
        }, this._includeSelf);

        return most;
    }

    get mostVersions(): VersionSummary {
        let max = 0;
        let map: VersionSummary = new Map();

        for (const [name, versions] of this.group) {
            if (versions.size > max) {
                max = versions.size;
                map = new Map([[name, new Set(versions.keys())]]);
            } else if (max === versions.size) {
                map.set(name, new Set(versions.keys()));
            }
        }

        return map;
    }

    get all(): Package[] {
        const all: Package[] = [];

        this._p.visit(d => all.push(d), this._includeSelf);

        return all;
    }

    get group(): Map<Name, Map<Version, Package>> {
        const sorted: Map<string, Map<string, Package>> = new Map();

        this._p.visit(d => {
            const packageName = sorted.get(d.name);

            if (packageName) {
                packageName.set(d.version, d);
            } else {
                sorted.set(d.name, new Map([[d.version, d]]));
            }
        }, this._includeSelf);

        return sorted;
    }
}

export class DependencyUtilities extends BaseDependencyUtilities {
    withSelf: BaseDependencyUtilities;

    constructor(_p: Package, _includeSelf: boolean = false) {
        super(_p, _includeSelf);

        this.withSelf = new BaseDependencyUtilities(_p, true);
    }
}
