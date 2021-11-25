"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathUtilities = void 0;
class PathUtilities {
    constructor(_p) {
        this._p = _p;
    }
    get path() {
        const path = [];
        let current = this._p;
        while (current.parent !== null) {
            path.push([current.name, current.version]);
            current = current.parent;
        }
        path.push([current.name, current.version]);
        return path.reverse();
    }
    get pathString() {
        const levels = [];
        for (const [name, version] of this.path) {
            levels.push(`${name}@${version}`);
        }
        return levels.join(" → ");
    }
}
exports.PathUtilities = PathUtilities;
//# sourceMappingURL=PathUtilities.js.map