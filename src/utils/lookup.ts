import * as path from "path";
import * as fs from "fs";
import * as readline from "readline";

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
    private readonly _lookups: ILookupEntry[] = [];

    get lookups(): ReadonlyArray<ILookupEntry> {
        return this._lookups;
    }

    constructor(private readonly _filePath: string) {}

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

export class LookupFileWriter {
    constructor(
        private readonly _targetFile: string,
        private readonly _lookups: ReadonlyArray<ILookupEntry>
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
