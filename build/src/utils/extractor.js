"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Extractor = void 0;
const path = require("path");
const fs = require("fs");
const flatFile_1 = require("../providers/flatFile");
const logger_1 = require("./logger");
const visitor_1 = require("../visitors/visitor");
const utils_1 = require("../visitors/utils");
//extract packages from dump file
class Extractor {
    constructor(_inputFile, _npmFile) {
        this._inputFile = _inputFile;
        this._npmFile = _npmFile;
        this._versions = [];
        this._resolvedPackages = new Map();
        this._provider = new flatFile_1.FlatFileProvider(this._npmFile);
        this._parseInputFile();
    }
    /* istanbul ignore next */
    static async Extract(inputFile, npmFile, targetDir, formatter) {
        const extractor = new Extractor(inputFile, npmFile);
        await extractor.extract();
        if (!fs.existsSync(targetDir))
            fs.mkdirSync(targetDir, { recursive: true });
        extractor.save(formatter, async (data, p, i, max) => {
            const padding = `${i + 1}`.padStart(max.toString().length);
            const partialDir = Extractor.PackageNameToDir(p.fullName);
            const packageDir = path.join(targetDir, partialDir);
            const fileName = partialDir.length > 0
                ? `${p.fullName}.json`.split(partialDir)[1]
                : `${p.fullName}.json`;
            if (!fileName)
                throw new Error(`fileName is undefined`);
            const filePath = path.join(packageDir, fileName);
            if (!fs.existsSync(packageDir))
                fs.mkdirSync(packageDir, { recursive: true });
            process.stdout.write(`[${padding}/${max}] ${filePath}\n`);
            fs.writeFileSync(filePath, data, "utf8");
        });
        extractor.writeLookupFile(path.join(targetDir, `lookup.txt`));
    }
    //get the dir part from a pkg name to save it correctly
    static PackageNameToDir(pkgName) {
        const [name] = (0, utils_1.getPackageVersionfromString)(pkgName);
        if (name.startsWith(`@`)) {
            const token = name.split("/")[0];
            if (!token)
                throw new Error(`Couldn't get package dir`);
            return token;
        }
        return "";
    }
    _parseInputFile() {
        const content = fs.readFileSync(this._inputFile, "utf8");
        const packageNames = JSON.parse(content);
        if (!Array.isArray(packageNames))
            throw new Error(`input data is not an array!`);
        this._versions = [];
        for (const name of packageNames) {
            this._versions.push((0, utils_1.getPackageVersionfromString)(name));
        }
    }
    async extract() {
        this._resolvedPackages = new Map();
        for (const [name, version] of this._versions) {
            const versionStr = version ? version : `latest`;
            process.stdout.write(`Fetching ${name}@${versionStr}\n`);
            const visitor = new visitor_1.Visitor([name, version], this._provider, new logger_1.OraLogger());
            const p = await visitor.visit();
            if (!this._resolvedPackages.has(p.fullName)) {
                this._resolvedPackages.set(p.fullName, p);
                //add distinct dependencies
                p.visit(dep => {
                    if (!this._resolvedPackages.has(dep.fullName))
                        this._resolvedPackages.set(dep.fullName, dep);
                });
            }
        }
        return this._resolvedPackages;
    }
    /* istanbul ignore next */
    writeLookupFile(lookupDestination) {
        const fd = fs.openSync(lookupDestination, "w");
        process.stdout.write(`Writing lookup file...\n`);
        for (const entry of this._resolvedPackages.keys()) {
            fs.writeSync(fd, `${entry}\n`, null, "utf8");
        }
        fs.closeSync(fd);
        process.stdout.write(`Generated lookup file at ${lookupDestination}\n`);
    }
    /* istanbul ignore next */
    async save(formatter, saveCallback) {
        try {
            let i = 0;
            for (const p of this._resolvedPackages.values()) {
                const jsonData = JSON.stringify(formatter(p));
                await saveCallback(jsonData, p, i++, this._resolvedPackages.size);
            }
        }
        catch (e) {
            process.stderr.write(`${e}`);
            throw new Error(`Couldn't save`);
        }
    }
}
exports.Extractor = Extractor;
//# sourceMappingURL=extractor.js.map