import * as path from "path";
import * as fs from "fs";

import { INpmPackageVersion } from "../npm";
import { EntryPackage } from "./resolver";

function getVersionFromPackageJson(rootPath: string): [string, string] {
    const packageJsonPath = path.join(rootPath, `package.json`);

    try {
        const content = fs.readFileSync(packageJsonPath, "utf8");
        const pkg: INpmPackageVersion = JSON.parse(content);

        return [pkg.name, pkg.version];
    } catch (e) {
        throw new Error(`Couldn't find package.json in ${rootPath}`);
    }
}

export function fromFolder(rootPath: string): EntryPackage {
    return getVersionFromPackageJson.bind(null, rootPath);
}
