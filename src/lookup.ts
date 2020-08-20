import * as path from "path";
import * as fs from "fs";
import * as readline from "readline";

import { INpmDumpRow } from "./npm";
import { getPercentage } from "./providers/flatFile";

export interface ILookupEntry {
    readonly name: string;
    readonly offset: number;
    readonly length: number;
}

export class LookupFileCreator {
    private _lookups: ILookupEntry[] = [];

    get lookups(): ReadonlyArray<ILookupEntry> {
        return this._lookups;
    }

    constructor(private _filePath: string) {}

    async parse(): Promise<void> {
        const rl = readline.createInterface({
            input: fs.createReadStream(this._filePath, { encoding: "latin1" }),
            crlfDelay: Infinity
        });
        const fileSize = fs.statSync(this._filePath).size;
        let parsedBytes = 0;

        console.log(
            `[${getPercentage(parsedBytes, fileSize)}%] Creating lookup for ${this._filePath}`
        );

        let i=0;

        for await (const line of rl) {
            if (this._isDataRow(line)) {
                const hasTrailingComma: boolean = line.endsWith(`,`);
                const jsonStr: string = hasTrailingComma ? line.slice(0, line.length - 1) : line;
                const { doc: pkg }: INpmDumpRow = JSON.parse(jsonStr);

                this._lookups.push({
                    name: pkg.name,
                    offset: parsedBytes,
                    length: jsonStr.length
                });

                console.log(`[${getPercentage(parsedBytes, fileSize)}%] ${pkg.name}`);
            }

            parsedBytes += line.length + 2; //+2 for win, else +1

            i++;
            if(i === 20)
                return;
        }

        console.log(`[${getPercentage(parsedBytes, fileSize)}%] Done`);
    }

    private _isDataRow(line: string): boolean {
        return line.endsWith(`}}`) || line.endsWith(`}},`);
    }
}

/* istanbul ignore next */
export async function createLookupFile(srcFile: string): Promise<void> {
    try {
        if (!fs.existsSync(srcFile)) {
            throw new Error(`Couldn't find lookup file: "${path.resolve(srcFile)}"`);
        }

        const lookupFile = getLookupFilePath(srcFile);

        if (fs.existsSync(lookupFile)) {
            const answer = await confirm(
                `Lookup file already exists at ${srcFile}\nContinue? [y/n] `
            );

            if (answer.toLowerCase() !== "y") return;
        }

        const creator = new LookupFileCreator(srcFile);

        await creator.parse();
        verifyLookups(srcFile, creator.lookups);
        saveLookupFile(lookupFile, creator.lookups);
    } catch (e) {
        console.log(e.message);
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
    return Math.floor(Math.random() * Math.floor(max));
}

/* istanbul ignore next */
function verifyLookups(srcFile: string, lookups: ReadonlyArray<ILookupEntry>): void {
    const tests: number[] = [
        random(lookups.length),
        random(lookups.length),
        random(lookups.length)
    ];

    for (const i of tests) {
        verifySingleLookup(srcFile, lookups[i]);
    }
}

/* istanbul ignore next */
function verifySingleLookup(
    srcFile: string,
    { name, offset, length }: Readonly<ILookupEntry>
): void {
    try {
        const fd = fs.openSync(srcFile, "r");
        const buffer = Buffer.alloc(length, undefined, "latin1");

        fs.readSync(fd, buffer, 0, length, offset);
        fs.closeSync(fd);

        const str = buffer.toString();
        console.log(13, str.slice(0, 32));
        console.log(14, str.slice(str.length - 32, str.length));
        const { doc: pkg }: INpmDumpRow = JSON.parse(str);

        if (pkg.name === name) {
            console.log(`Correctly verified random package "${name}"`);
        } else {
            throw new Error(`Package name didn't match [${name}/${pkg.name}]`);
        }
    } catch (e) {
        throw new Error(`Couldn't verify lookup`);
    }
}

export class LookupFileWriter {
    constructor(private _targetFile: string, private _lookups: ReadonlyArray<ILookupEntry>) {}

    static getLine({ name, offset, length }: ILookupEntry): string {
        return `${name} ${offset} ${length}\n`;
    }

    /* istanbul ignore next */
    write(): void {
        const fd = fs.openSync(this._targetFile, "w");
        const size = this._lookups.length;
        const fullPath = path.resolve(this._targetFile);
        let i = 0;

        console.log(`Creating lookup file "${fullPath}"`);
        for (const lookup of this._lookups) {
            console.log(`[${getPercentage(++i, size)}%] added ${lookup.name}`);
            fs.writeSync(fd, LookupFileWriter.getLine(lookup));
        }

        fs.closeSync(fd);
        console.log(`Done, Created lookup file at "${fullPath}"`);
    }
}

function confirm(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve =>
        rl.question(question, answer => {
            rl.close();
            resolve(answer);
        })
    );
}
