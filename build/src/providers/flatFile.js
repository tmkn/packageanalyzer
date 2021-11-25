"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPercentage = exports.FlatFileProvider = void 0;
const readline = require("readline");
const fs = require("fs");
const os = require("os");
const path = require("path");
const semver = require("semver");
const logger_1 = require("../utils/logger");
//parses npm data from https://replicate.npmjs.com/_all_docs?limit=4&include_docs=true
//needs a lookup file
class FlatFileProvider {
    constructor(_file) {
        this._file = _file;
        this._lookup = new Map();
        this._cache = new Map();
        this._initialized = false;
        this._logger = new logger_1.OraLogger();
        this._lookupFile = FlatFileProvider.getLookupFile(this._file);
    }
    static getLookupFile(npmFile) {
        try {
            const baseName = path.basename(npmFile, path.extname(npmFile));
            const folder = path.dirname(npmFile);
            return path.join(folder, `${baseName}.lookup.txt`);
        }
        catch (e) {
            throw new Error(`Couldn't find lookup file for ${npmFile}`);
        }
    }
    async getPackageInfo(name) {
        return this._getPackage(name);
    }
    async getPackageJson(name, version) {
        if (!this._initialized) {
            await this.parseLookupFile();
            this._initialized = true;
        }
        const pkgInfo = this._getPackage(name);
        //get latest version
        if (typeof version === "undefined") {
            const latest = pkgInfo["dist-tags"].latest;
            const latestPackageJson = pkgInfo.versions[latest];
            if (!latestPackageJson)
                throw new Error(`Couldn't find latest version ${latest} for package ${name}`);
            return latestPackageJson;
        }
        //get specific version
        else {
            const versions = [...Object.keys(pkgInfo.versions)];
            const resolvedVersion = semver.maxSatisfying(versions, version);
            if (resolvedVersion === null) {
                throw new Error(`Couldn't resolve ${version} for ${name}`);
            }
            const specificPackageJson = pkgInfo.versions[resolvedVersion];
            if (!specificPackageJson)
                throw new Error(`Couldn't find version: ${resolvedVersion} for package ${name}`);
            return specificPackageJson;
        }
    }
    async *getPackageJsons(modules) {
        for (const [name, version] of modules) {
            yield this.getPackageJson(name, version);
        }
    }
    async parseLookupFile() {
        const rl = readline.createInterface({
            input: fs.createReadStream(this._lookupFile),
            crlfDelay: Infinity
        });
        const fileSize = fs.statSync(this._lookupFile).size;
        let parsedBytes = 0;
        let lineNum = 0;
        this._lookup.clear();
        this._logger.start();
        for await (const line of rl) {
            try {
                parsedBytes += Buffer.byteLength(line, "utf8");
                const name = this._parseLine(line, ++lineNum);
                this._logger.log(`Parsing Lookup [${getPercentage(parsedBytes, fileSize)}%] ${name}`);
            }
            catch (e) {
                this._logger.log(`Couldn't parse line: ${lineNum}`);
            }
        }
        this._logger.stop();
    }
    _parseLine(line, lineNum) {
        const [name, offset, length] = line.split(" ").map(l => l.trim());
        if (!name || !offset || !length)
            throw new Error(`Couldn't parse line`);
        const _offset = parseInt(offset);
        const _length = parseInt(length);
        //due to the way newlines are interpreted between different os, we need to correct the offset
        //basically if win add +1 for every newline since win -> \r\n -> 2char, *nix -> \n -> 1char
        const correctedOffset = os.platform() !== "win32" ? _offset : _offset + lineNum;
        const lookup = {
            offset: correctedOffset,
            length: _length
        };
        this._lookup.set(name, lookup);
        return name;
    }
    _getPackage(name) {
        const cachedPkg = this._getFromCache(name);
        if (typeof cachedPkg !== "undefined")
            return cachedPkg;
        return this._getFromLookup(name);
    }
    _getFromLookup(pkgName) {
        const lookupInfo = this._lookup.get(pkgName);
        if (typeof lookupInfo === "undefined")
            throw new Error(`Couldn't finde package "${pkgName}"`);
        const { offset, length } = lookupInfo;
        const fd = fs.openSync(this._file, "r");
        const buffer = Buffer.alloc(length);
        fs.readSync(fd, buffer, 0, length, offset);
        fs.closeSync(fd);
        const { doc: pkg } = JSON.parse(buffer.toString());
        this._cache.set(pkgName, pkg);
        return pkg;
    }
    _getFromCache(pkgName) {
        return this._cache.get(pkgName);
    }
}
exports.FlatFileProvider = FlatFileProvider;
function getPercentage(current, total) {
    const progress = (current / total) * 100;
    return `${progress.toFixed(2).padStart(6)}`;
}
exports.getPercentage = getPercentage;
//# sourceMappingURL=flatFile.js.map