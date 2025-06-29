import * as path from "path";
import * as fs from "fs";
import * as readline from "readline";
import * as os from "os";
import * as crypto from "crypto";

import { type INpmDumpRow } from "../npm.js";
import { getPercentage } from "../providers/flatFile.js";

const newLine = "\n";

export interface ILookupEntry {
    readonly name: string;
    readonly offset: number;
    readonly length: number;
    readonly line: number;
}

export class LookupFileCreator {
    private _lookups: ILookupEntry[] = [];

    get lookups(): ReadonlyArray<ILookupEntry> {
        return this._lookups;
    }

    constructor(private _filePath: string) {}

    async parse(): Promise<void> {
        const rl = readline.createInterface({
            input: fs.createReadStream(this._filePath),
            crlfDelay: Infinity
        });
        const fileSize = fs.statSync(this._filePath).size;
        let parsedBytes = 0;
        const startToken = `{"id":"`;

        log(`[${getPercentage(parsedBytes, fileSize)}%] Creating lookup for ${this._filePath}`);
        let i = 0;

        for await (const line of rl) {
            const lineByteLength = Buffer.byteLength(line, "utf8");

            if (line.startsWith(startToken)) {
                const json: string = line.endsWith(`,`) ? line.slice(0, line.length - 1) : line;
                const length = Buffer.byteLength(json, "utf8");
                const { doc: pkg }: INpmDumpRow = JSON.parse(json);

                this._lookups.push({
                    name: pkg.name,
                    offset: parsedBytes,
                    length: length,
                    line: i
                });

                log(`[${getPercentage(parsedBytes, fileSize)}%] ${pkg.name}`);
            }

            parsedBytes += lineByteLength + newLine.length;
            i++;
        }

        log(`[${getPercentage(parsedBytes, fileSize)}%] Done`);
    }
}

/* istanbul ignore next */
export async function createLookupFile(srcFile: string): Promise<void> {
    try {
        if (!fs.existsSync(srcFile)) {
            throw new Error(`Couldn't find lookup file: "${path.resolve(srcFile)}"`);
        }

        const lookupFile = getLookupFilePath(srcFile);
        const creator = new LookupFileCreator(srcFile);

        await creator.parse();
        verifyLookups(srcFile, creator.lookups);
        saveLookupFile(lookupFile, creator.lookups);
    } catch (e) {
        const msg: string = e instanceof Error ? e.message : `Error creating lookup file`;

        log(msg);
    }
}

/* istanbul ignore next */
function getLookupFilePath(srcFile: string): string {
    const folder = path.dirname(srcFile);
    const name = path.basename(srcFile, path.extname(srcFile));

    return path.join(folder, `${name}.lookup.txt`);
}

/* istanbul ignore next */
function saveLookupFile(lookupFile: string, lookups: ReadonlyArray<ILookupEntry>): void {
    if (fs.existsSync(lookupFile)) {
        const absolutePath = path.resolve(lookupFile);

        throw new Error(`Lookup "${absolutePath}" already exits, delete to recreate`);
    }

    const writer = new LookupFileWriter(lookupFile, lookups);

    writer.write();
}

/* istanbul ignore next */
function random(max: number) {
    return crypto.randomInt(0, max);
}

/* istanbul ignore next */
function verifyLookups(srcFile: string, lookups: ReadonlyArray<ILookupEntry>): void {
    const tests: number[] = [
        random(lookups.length),
        random(lookups.length),
        random(lookups.length)
    ];

    for (const i of tests) {
        const lookup = lookups[i];

        if (!lookup) throw new Error(`Lookup was undefined`);

        verifySingleLookup(srcFile, lookup);
    }
}

/* istanbul ignore next */
function verifySingleLookup(
    srcFile: string,
    { name, offset, length, line }: Readonly<ILookupEntry>
): void {
    try {
        const fd = fs.openSync(srcFile, "r");
        const buffer = Buffer.alloc(length);

        if (os.platform() === "win32") {
            offset += line;
        }

        fs.readSync(fd, buffer, 0, length, offset);
        fs.closeSync(fd);

        const str = buffer.toString();
        const { doc: pkg }: INpmDumpRow = JSON.parse(str);

        if (pkg.name === name) {
            log(`Correctly verified random package "${name}"`);
        } else {
            throw new Error(`Package name didn't match [${name}/${pkg.name}]`);
        }
    } catch {
        throw new Error(`Couldn't verify lookup`);
    }
}

export class LookupFileWriter {
    constructor(
        private _targetFile: string,
        private _lookups: ReadonlyArray<ILookupEntry>
    ) {}

    static getLine({ name, offset, length }: ILookupEntry): string {
        return `${name} ${offset} ${length}${newLine}`;
    }

    /* istanbul ignore next */
    write(): void {
        const fd = fs.openSync(this._targetFile, "w");
        const size = this._lookups.length;
        const fullPath = path.resolve(this._targetFile);
        let i = 0;

        log(`Creating lookup file "${fullPath}"`);
        for (const lookup of this._lookups) {
            console.log(`[${getPercentage(++i, size)}%] added ${lookup.name}`);
            fs.writeSync(fd, LookupFileWriter.getLine(lookup));
        }

        fs.closeSync(fd);
        log(`Done, Created lookup file at "${fullPath}"`);
    }
}

function log(msg: string): void {
    if (process.env.NODE_ENV !== "test") console.log(msg);
}
