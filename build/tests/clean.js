"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
function getFolderRecursively(folder) {
    try {
        const items = [];
        const content = fs.readdirSync(folder);
        for (const entry of content) {
            const fullPath = path.join(folder, entry);
            if (fs.statSync(fullPath).isDirectory()) {
                items.push(...getFolderRecursively(fullPath));
            }
            else {
                items.push(fullPath);
            }
        }
        return items;
    }
    catch (e) {
        console.log(e);
        return [];
    }
}
//cleans a node_modules folder so that only the package.json remains
function cleanFolder(paths) {
    for (const entry of paths.sort()) {
        if (!entry.endsWith(`package.json`)) {
            fs.unlinkSync(entry);
            const folder = path.dirname(entry);
            if (fs.readdirSync(folder).length === 0) {
                fs.rmdirSync(folder);
            }
        }
        else {
            cleanJson(entry);
        }
    }
}
//strips sensitive data in package.json
function stripSensitiveKeys(data) {
    for (const [key] of Object.entries(data)) {
        if (key.startsWith(`_`)) {
            delete data[key];
        }
    }
    return data;
}
function cleanJson(file) {
    const content = fs.readFileSync(file, "utf8");
    let data = JSON.parse(content);
    data = stripSensitiveKeys(data);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}
const folders = [
    path.join("tests", "data", "testproject1"),
    path.join("tests", "data", "testproject2")
];
for (const folder of folders) {
    console.log(`Cleaning ${folder} ...`);
    const items = getFolderRecursively(folder);
    cleanFolder(items);
}
//# sourceMappingURL=clean.js.map