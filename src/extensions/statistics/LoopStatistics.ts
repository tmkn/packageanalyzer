import { Package } from "../../analyzers/package";
import { IFormatter } from "../../formatter";
import { ITreeFormatter, print } from "../../tree";

export function printDependencyTree(p: Package, formatter: IFormatter): void {
    const converter: ITreeFormatter<Package> = {
        getLabel: data => `${data.fullName} (${data.transitiveDependenciesCount} dependencies)`,
        getChildren: data => data.directDependencies
    };

    print<Package>(p, converter, formatter);
}

export class LoopStatistics {
    constructor(private _p: Package) {}

    //returns the loop path e.g. c->d->c instead of the whole path a->b->c->d->c
    get loopPathString(): string {
        const split = this._p.pathString.indexOf(this._p.fullName);

        return this._p.pathString.slice(split);
    }

    get loops(): Package[] {
        const loops: Package[] = [];

        this._p.visit(d => {
            if (d.isLoop) loops.push(d);
        }, true);

        return loops;
    }

    get loopPathMap(): ReadonlyMap<string, Set<string>> {
        const map: Map<string, Set<string>> = new Map();
        const loops = this.loops;

        for (const p of loops) {
            const loopsStatistic = new LoopStatistics(p);
            const entry = map.get(p.name);

            if (entry) {
                entry.add(loopsStatistic.loopPathString);
            } else {
                map.set(p.name, new Set([loopsStatistic.loopPathString]));
            }
        }

        return map;
    }

    get distinctLoopCount(): number {
        return [...this.loopPathMap].reduce((i, [, loops]) => i + loops.size, 0);
    }
}
