"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.map = void 0;
//useful maybe later? ¯\_(ツ)_/¯
//maps Package to another format
function map(p, mapFn) {
    const mappedDependency = {
        ...mapFn(p),
        parent: null,
        dependencies: []
    };
    mappedDependency.dependencies = p.directDependencies.map(childPa => {
        const child = map(childPa, mapFn);
        child.parent = mappedDependency;
        return child;
    });
    return mappedDependency;
}
exports.map = map;
//# sourceMappingURL=map.js.map