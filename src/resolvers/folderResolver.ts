import * as path from "path";
import * as fs from "fs";

import { INpmPackage } from "../npm";
import { PackageAnalytics } from "../analyzer";
import { NodeModulesProvider } from "../providers/folderProvider";
import { walkDependencies } from "./nameResolver";

//resolves dependencies based on a package.json
export async function resolveFromFolder(rootPath: string): Promise<PackageAnalytics> {
    let depth: string[] = [];

    try {
        const packageJsonPath = path.join(rootPath, `package.json`);
        const rootPackageJson = loadPackageJson(packageJsonPath);
        const nodeModulesPath = path.join(rootPath, `node_modules`);

        if (rootPackageJson === null) {
            throw `Couldn't find package.json in "${packageJsonPath}"`;
        }

        if (!fs.existsSync(nodeModulesPath)) {
            throw `node_modules folder doesn't exist, did you run npm install?`;
        }

        const npm = new NodeModulesProvider(nodeModulesPath);
        let root = new PackageAnalytics(rootPackageJson);

        try {
            console.log(`Resolving dependencies for ${root.fullName}`);
            await walkDependencies(npm, root, rootPackageJson.dependencies, depth);
        } catch (e) {
            console.log(`Error evaluating dependencies`);
            console.log(e);
        }

        console.log(`Done\n`);

        return root;
    } catch (e) {
        console.log(e);

        throw e;
    }
}

function loadPackageJson(path: string): INpmPackage | null {
    try {
        const content = fs.readFileSync(path, "utf8");

        return JSON.parse(content);
    } catch (e) {
        return null;
    }
}
