"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackageVersionFromPackageJson = exports.getPackageVersionfromString = void 0;
const path = require("path");
const fs = require("fs");
function getPackageVersionfromString(name) {
    const isScoped = name.startsWith(`@`);
    const [part1, part2, ...rest] = isScoped ? name.slice(1).split("@") : name.split("@");
    if (rest.length > 0)
        throw new Error(`Too many split tokens`);
    if (part1) {
        if (part2?.trim()?.length === 0)
            throw new Error(`Unable to determine version from "${name}"`);
        return isScoped ? [`@${part1}`, part2] : [part1, part2];
    }
    throw new Error(`Couldn't parse fullName token`);
}
exports.getPackageVersionfromString = getPackageVersionfromString;
function getPackageVersionFromPackageJson(folder) {
    const packageJsonPath = path.join(folder, `package.json`);
    try {
        const content = fs.readFileSync(packageJsonPath, "utf8");
        const pkg = JSON.parse(content);
        return [pkg.name, pkg.version];
    }
    catch (e) {
        throw new Error(`Couldn't find package.json in ${folder}`);
    }
}
exports.getPackageVersionFromPackageJson = getPackageVersionFromPackageJson;
//# sourceMappingURL=utils.js.map