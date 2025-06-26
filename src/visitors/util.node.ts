import * as path from "path";
import * as fs from "fs";

import { type PackageVersion } from "./visitor.js";
import { type IPackageJson } from "../npm.js";

export function getPackageVersionFromPath(folder: string): PackageVersion {
    const packageJsonPath = path.join(folder, `package.json`);

    try {
        const content = fs.readFileSync(packageJsonPath, "utf8");
        const pkg: IPackageJson = JSON.parse(content);

        return [pkg.name, pkg.version];
    } catch {
        throw new Error(`Couldn't find package.json in ${folder}`);
    }
}
