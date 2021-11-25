"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoopUtilities = exports.printDependencyTree = void 0;
const tree_1 = require("../../utils/tree");
const DependencyUtilities_1 = require("./DependencyUtilities");
const PathUtilities_1 = require("./PathUtilities");
function printDependencyTree(p, formatter) {
    const converter = {
        getLabel: data => `${data.fullName} (${new DependencyUtilities_1.DependencyUtilities(data).transitiveCount} dependencies)`,
        getChildren: data => data.directDependencies
    };
    (0, tree_1.print)(p, converter, formatter);
}
exports.printDependencyTree = printDependencyTree;
class LoopUtilities {
    constructor(_p) {
        this._p = _p;
    }
    //returns the loop path e.g. c->d->c instead of the whole path a->b->c->d->c
    get loopPathString() {
        const split = new PathUtilities_1.PathUtilities(this._p).pathString.indexOf(this._p.fullName);
        return new PathUtilities_1.PathUtilities(this._p).pathString.slice(split);
    }
    get loops() {
        const loops = [];
        this._p.visit(d => {
            if (d.isLoop)
                loops.push(d);
        }, true);
        return loops;
    }
    get loopPathMap() {
        const map = new Map();
        const loops = this.loops;
        for (const p of loops) {
            const loopsStatistic = new LoopUtilities(p);
            const entry = map.get(p.name);
            if (entry) {
                entry.add(loopsStatistic.loopPathString);
            }
            else {
                map.set(p.name, new Set([loopsStatistic.loopPathString]));
            }
        }
        return map;
    }
    get distinctLoopCount() {
        return [...this.loopPathMap].reduce((i, [, loops]) => i + loops.size, 0);
    }
}
exports.LoopUtilities = LoopUtilities;
//# sourceMappingURL=LoopUtilities.js.map