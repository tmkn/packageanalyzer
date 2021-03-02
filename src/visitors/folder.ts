import * as path from "path";
import * as fs from "fs";

import { INpmPackageVersion } from "../npm";
import { PackageVersion } from "./visitor";

export function getPackageJson(folder: string): PackageVersion {
    const packageJsonPath = path.join(folder, `package.json`);

    try {
        const content = fs.readFileSync(packageJsonPath, "utf8");
        const pkg: INpmPackageVersion = JSON.parse(content);

        return [pkg.name, pkg.version];
    } catch (e) {
        throw new Error(`Couldn't find package.json in ${folder}`);
    }
}
