"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LookupFileWriter = exports.createLookupFile = exports.LookupFileCreator = void 0;
const path = require("path");
const fs = require("fs");
const readline = require("readline");
const os = require("os");
const crypto = require("crypto");
const flatFile_1 = require("../providers/flatFile");
const newLine = "\n";
class LookupFileCreator {
    constructor(_filePath) {
        this._filePath = _filePath;
        this._lookups = [];
    }
    get lookups() {
        return this._lookups;
    }
    async parse() {
        const rl = readline.createInterface({
            input: fs.createReadStream(this._filePath),
            crlfDelay: Infinity
        });
        const fileSize = fs.statSync(this._filePath).size;
        let parsedBytes = 0;
        const startToken = `{"id":"`;
        log(`[${(0, flatFile_1.getPercentage)(parsedBytes, fileSize)}%] Creating lookup for ${this._filePath}`);
        let i = 0;
        for await (const line of rl) {
            const lineByteLength = Buffer.byteLength(line, "utf8");
            if (line.startsWith(startToken)) {
                const json = line.endsWith(`,`) ? line.slice(0, line.length - 1) : line;
                const length = Buffer.byteLength(json, "utf8");
                const { doc: pkg } = JSON.parse(json);
                this._lookups.push({
                    name: pkg.name,
                    offset: parsedBytes,
                    length: length,
                    line: i
                });
                log(`[${(0, flatFile_1.getPercentage)(parsedBytes, fileSize)}%] ${pkg.name}`);
            }
            parsedBytes += lineByteLength + newLine.length;
            i++;
        }
        log(`[${(0, flatFile_1.getPercentage)(parsedBytes, fileSize)}%] Done`);
    }
}
exports.LookupFileCreator = LookupFileCreator;
/* istanbul ignore next */
async function createLookupFile(srcFile) {
    try {
        if (!fs.existsSync(srcFile)) {
            throw new Error(`Couldn't find lookup file: "${path.resolve(srcFile)}"`);
        }
        const lookupFile = getLookupFilePath(srcFile);
        const creator = new LookupFileCreator(srcFile);
        await creator.parse();
        verifyLookups(srcFile, creator.lookups);
        saveLookupFile(lookupFile, creator.lookups);
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : `Error creating lookup file`;
        log(msg);
    }
}
exports.createLookupFile = createLookupFile;
/* istanbul ignore next */
function getLookupFilePath(srcFile) {
    const folder = path.dirname(srcFile);
    const name = path.basename(srcFile, path.extname(srcFile));
    return path.join(folder, `${name}.lookup.txt`);
}
/* istanbul ignore next */
function saveLookupFile(lookupFile, lookups) {
    if (fs.existsSync(lookupFile)) {
        const absolutePath = path.resolve(lookupFile);
        throw new Error(`Lookup "${absolutePath}" already exits, delete to recreate`);
    }
    const writer = new LookupFileWriter(lookupFile, lookups);
    writer.write();
}
/* istanbul ignore next */
function random(max) {
    return crypto.randomInt(0, max);
}
/* istanbul ignore next */
function verifyLookups(srcFile, lookups) {
    const tests = [
        random(lookups.length),
        random(lookups.length),
        random(lookups.length)
    ];
    for (const i of tests) {
        const lookup = lookups[i];
        if (!lookup)
            throw new Error(`Lookup was undefined`);
        verifySingleLookup(srcFile, lookup);
    }
}
/* istanbul ignore next */
function verifySingleLookup(srcFile, { name, offset, length, line }) {
    try {
        const fd = fs.openSync(srcFile, "r");
        const buffer = Buffer.alloc(length);
        if (os.platform() === "win32") {
            offset += line;
        }
        fs.readSync(fd, buffer, 0, length, offset);
        fs.closeSync(fd);
        const str = buffer.toString();
        const { doc: pkg } = JSON.parse(str);
        if (pkg.name === name) {
            log(`Correctly verified random package "${name}"`);
        }
        else {
            throw new Error(`Package name didn't match [${name}/${pkg.name}]`);
        }
    }
    catch (e) {
        throw new Error(`Couldn't verify lookup`);
    }
}
class LookupFileWriter {
    constructor(_targetFile, _lookups) {
        this._targetFile = _targetFile;
        this._lookups = _lookups;
    }
    static getLine({ name, offset, length }) {
        return `${name} ${offset} ${length}${newLine}`;
    }
    /* istanbul ignore next */
    write() {
        const fd = fs.openSync(this._targetFile, "w");
        const size = this._lookups.length;
        const fullPath = path.resolve(this._targetFile);
        let i = 0;
        log(`Creating lookup file "${fullPath}"`);
        for (const lookup of this._lookups) {
            console.log(`[${(0, flatFile_1.getPercentage)(++i, size)}%] added ${lookup.name}`);
            fs.writeSync(fd, LookupFileWriter.getLine(lookup));
        }
        fs.closeSync(fd);
        log(`Done, Created lookup file at "${fullPath}"`);
    }
}
exports.LookupFileWriter = LookupFileWriter;
function log(msg) {
    if (process.env.NODE_ENV !== "test")
        console.log(msg);
}
//# sourceMappingURL=lookup.js.map