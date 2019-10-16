import * as path from "path";
import * as fs from "fs";
import * as readline from "readline";
//import * as os from "os";
import { INpmDumpRow } from "./npm";
import { getPercentage } from "./providers/flatFile";

const newLine = "\r\n";

export interface ILookupEntry {
    name: string;
    offset: number;
    length: number;
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
        //const newlineLength = os.platform() !== "win32" ? 1 : 2;
        let parsedBytes = 0;
        const startToken = `{"id":"`;

        console.log(
            `[${getPercentage(parsedBytes, fileSize)}%] Creating lookup for ${this._filePath}`
        );

        for await (const line of rl) {
            const lineByteLength = Buffer.byteLength(line, "utf8");

            if (line.startsWith(startToken)) {
                const json: string = line.endsWith(`,`) ? line.slice(0, line.length - 1) : line;
                const length = Buffer.byteLength(json, "utf8");
                const { doc: pkg }: INpmDumpRow = JSON.parse(json);

                this._lookups.push({
                    name: pkg.name,
                    offset: parsedBytes,
                    length: length
                });

                console.log(`[${getPercentage(parsedBytes, fileSize)}%] ${pkg.name}`);
            }

            parsedBytes += lineByteLength + newLine.length;
        }

        console.log(`[${getPercentage(parsedBytes, fileSize)}%] Done`);
    }
}

/* istanbul ignore next */
export async function testLookup(file: string): Promise<void> {
    const creator = new LookupFileCreator(file);

    await creator.parse();

    for (const l of creator.lookups) {
        console.log(
            l.name.padEnd(32),
            l.offset.toString().padStart(10),
            l.length.toString().padStart(10),
            `|`,
            testLookup(l),
            `\n\n`
        );
    }

    function testLookup({ name, offset, length }: ILookupEntry): string {
        
        const fd = fs.openSync(file, "r");
        const buffer = Buffer.alloc(length);

        fs.readSync(fd, buffer, 0, length, offset);
        fs.closeSync(fd);

        const str = buffer.toString();
        const parsedOk: string = couldParse(str) ? "[ok]" : "[failed]"

        return `${parsedOk.padStart(8)} | ${str.slice(0, 32)} ... ${str.slice(str.length - 32)}`;
    }

    function couldParse(data: string): boolean {
        try {
            JSON.parse(data);

            return true;
        }
        catch(e) {
            return false;
        }
    }
}

/* istanbul ignore next */
export class LookupFileWriter {
    constructor(private _file: string, private _data: ReadonlyArray<ILookupEntry>) {}

    static getLine({ name, offset, length }: ILookupEntry): string {
        return `${name} ${offset} ${length}${newLine}`;
    }

    write(): void {
        const fd = fs.openSync(this._file, "w");

        for (const lookup of this._data) {
            fs.writeSync(fd, LookupFileWriter.getLine(lookup));
        }

        fs.closeSync(fd);
    }
}
