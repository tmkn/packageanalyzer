"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyUtilities = void 0;
//utility functions for the dependency tree
class BaseDependencyUtilities {
    constructor(_p, _includeSelf) {
        this._p = _p;
        this._includeSelf = _includeSelf;
    }
    get transitiveCount() {
        let count = 0;
        this._p.visit(() => count++, this._includeSelf);
        return count;
    }
    get distinctNameCount() {
        return this.distinctNames.size;
    }
    get distinctVersionCount() {
        const packageNames = new Set();
        this._p.visit(d => packageNames.add(d.fullName), this._includeSelf);
        return packageNames.size;
    }
    get distinctNames() {
        const distinct = new Set();
        this._p.visit(d => distinct.add(d.name), this._includeSelf);
        return distinct;
    }
    get mostReferred() {
        const mostReferred = new Map();
        this._p.visit(d => {
            const entry = mostReferred.get(d.name);
            if (entry) {
                mostReferred.set(d.name, entry + 1);
            }
            else {
                mostReferred.set(d.name, 1);
            }
        }, this._includeSelf);
        let max = [...mostReferred.values()].reduce((prev, current) => (current > prev ? current : prev), 0);
        return {
            count: max,
            pkgs: [...mostReferred.entries()]
                .filter(([, count]) => count === max)
                .map(([name]) => name)
        };
    }
    get mostDirectDependencies() {
        let most = [this._p];
        this._p.visit(d => {
            if (d.directDependencies.length > most[0].directDependencies.length) {
                most = [d];
            }
            else if (d.directDependencies.length === most[0].directDependencies.length) {
                most.push(d);
            }
        }, this._includeSelf);
        return most;
    }
    get mostVersions() {
        let max = 0;
        let map = new Map();
        for (const [name, versions] of this.group) {
            if (versions.size > max) {
                max = versions.size;
                map = new Map([[name, new Set(versions.keys())]]);
            }
            else if (max === versions.size) {
                map.set(name, new Set(versions.keys()));
            }
        }
        return map;
    }
    get all() {
        const all = [];
        this._p.visit(d => all.push(d), this._includeSelf);
        return all;
    }
    get group() {
        const sorted = new Map();
        this._p.visit(d => {
            const packageName = sorted.get(d.name);
            if (packageName) {
                packageName.set(d.version, d);
            }
            else {
                sorted.set(d.name, new Map([[d.version, d]]));
            }
        }, this._includeSelf);
        return sorted;
    }
}
class DependencyUtilities extends BaseDependencyUtilities {
    constructor(_p, _includeSelf = false) {
        super(_p, _includeSelf);
        this.withSelf = new BaseDependencyUtilities(_p, true);
    }
}
exports.DependencyUtilities = DependencyUtilities;
//# sourceMappingURL=DependencyUtilities.js.map