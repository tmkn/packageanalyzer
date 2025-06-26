import { type IPackage } from "../../package/package.js";
import { type IFormatter } from "../../utils/formatter.js";
import { type ITreeFormatter, print } from "../../utils/tree.js";
import { DependencyUtilities } from "./DependencyUtilities.js";
import { PathUtilities } from "./PathUtilities.js";

export function printDependencyTree(p: IPackage, formatter: IFormatter): void {
    const converter: ITreeFormatter<IPackage> = {
        getLabel: data =>
            `${data.fullName} (${new DependencyUtilities(data).transitiveCount} dependencies)`,
        getChildren: data => data.directDependencies
    };

    print<IPackage>(p, converter, formatter);
}

export class LoopUtilities {
    constructor(private _p: IPackage) {}

    //returns the loop path e.g. c->d->c instead of the whole path a->b->c->d->c
    get loopPathString(): string {
        const split = new PathUtilities(this._p).pathString.indexOf(this._p.fullName);

        return new PathUtilities(this._p).pathString.slice(split);
    }

    get loops(): IPackage[] {
        const loops: IPackage[] = [];

        this._p.visit(d => {
            if (d.isLoop) loops.push(d);
        }, true);

        return loops;
    }

    get loopPathMap(): ReadonlyMap<string, Set<string>> {
        const map: Map<string, Set<string>> = new Map();
        const loops = this.loops;

        for (const p of loops) {
            const loopsStatistic = new LoopUtilities(p);
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
