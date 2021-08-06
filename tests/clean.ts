import * as fs from "fs";
import * as path from "path";
import { IPackageJson } from "../src/npm";

function getFolderRecursively(folder: string): string[] {
    try {
        const items: string[] = [];
        const content = fs.readdirSync(folder);

        for (const entry of content) {
            const fullPath = path.join(folder, entry);

            if (fs.statSync(fullPath).isDirectory()) {
                items.push(...getFolderRecursively(fullPath));
            } else {
                items.push(fullPath);
            }
        }

        return items;
    } catch (e) {
        console.log(e);

        return [];
    }
}

//cleans a node_modules folder so that only the package.json remains
function cleanFolder(paths: string[]): void {
    for (const entry of paths.sort()) {
        if (!entry.endsWith(`package.json`)) {
            fs.unlinkSync(entry);

            const folder = path.dirname(entry);

            if (fs.readdirSync(folder).length === 0) {
                fs.rmdirSync(folder);
            }
        } else {
            cleanJson(entry);
        }
    }
}

//strips sensitive data in package.json
function stripSensitiveKeys(data: IPackageJson): IPackageJson {
    for (const [key] of Object.entries(data)) {
        if (key.startsWith(`_`)) {
            delete data[key as keyof IPackageJson];
        }
    }

    return data;
}

function cleanJson(file: string): void {
    const content = fs.readFileSync(file, "utf8");
    let data: IPackageJson = JSON.parse(content);

    data = stripSensitiveKeys(data);

    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

const folders: string[] = [
    path.join("tests", "data", "testproject1"),
    path.join("tests", "data", "testproject2")
];

for (const folder of folders) {
    console.log(`Cleaning ${folder} ...`);

    const items = getFolderRecursively(folder);
    cleanFolder(items);
}
