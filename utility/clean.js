//clean target folder

const fs = require("fs");
const path = require("path");

const buildDir = "./build";
const files = readDir(buildDir);

deleteFolder(files);
console.log(`Cleaned ${buildDir}`);

function deleteFolder(files) {
    for (const file of files) {
        fs.unlinkSync(file);

        if (fs.readdirSync(path.dirname(file)).length === 0) {
            fs.rmdirSync(path.dirname(file));
        }
    }
}

function readDir(folder) {
    let files = [];

    try {
        if (!fs.existsSync(folder)) {
            throw `Couldn't find ${folder}`;
        }

        let content = fs.readdirSync(folder);

        for (const file of content) {
            const fullPath = path.join(folder, file);

            if (fs.statSync(fullPath).isDirectory()) {
                files = [...files, ...readDir(fullPath)];
            } else {
                files.push(fullPath);
            }
        }
    } catch (e) {
        console.log(e);
    }

    return files;
}
