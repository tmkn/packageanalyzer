import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";

import { INpmPackageInfo } from "./npm";

//extract package metadata info from json dump
//e.g. https://replicate.npmjs.com/_all_docs?include_docs=true&limit=50&skip=4050

interface IJsonExtractResult {
    offset: number;
    pkg: INpmPackageInfo;
    progress: [number, number];
}

interface IJsonSaveResult {
    offset: number;
    pkg: INpmPackageInfo;
    progress: [number, number];
    destination: string;
}

interface INpmJsonExtractor {
    extractPackages: () => AsyncIterableIterator<IJsonExtractResult>;
    savePackages: (targetFolder: string) => AsyncIterableIterator<IJsonSaveResult>;
}

class NpmJsonExtractor implements INpmJsonExtractor {
    constructor(private _jsonPath: string) {}

    //extract package metadata from json npm dump
    async *extractPackages(): AsyncIterableIterator<IJsonExtractResult> {
        //todo try readline for of
        /*const rl = readline.createInterface({
            input: fs.createReadStream(this._jsonPath)
        });

        for await(const line of rl) {

        }*/

        const stream = fs.createReadStream(this._jsonPath);

        try {
            const start = await this._getOffset();
            let offset = start;
            let incompleteChunk = "";
            let { size: fileSize } = fs.statSync(this._jsonPath);
            let readBytes = 0;

            console.log(
                `Parsing "${this._jsonPath}" ${fileSize / 1024 / 1024} MB/${fileSize} bytes`
            );

            for await (const chunk of stream) {
                let lines: string[] = chunk.toString().split("\n");
                let processIncompleteChunk = false;
                let startTime = process.hrtime();

                readBytes += chunk.toString().length;

                //if chunk doesn't contain newline add it to exisiting incomplete chunk
                if (lines.length === 1) {
                    if (incompleteChunk.startsWith(`{"id":`)) incompleteChunk += lines[0];
                } else {
                    //if we have a previous chunk add first line to chunk
                    if (incompleteChunk.startsWith(`{"id":`)) {
                        incompleteChunk += lines[0];
                        processIncompleteChunk = true;
                    }

                    let [lastLine] = lines.splice(-1);

                    //incomplte chunk is now complete, add it
                    if (processIncompleteChunk) {
                        lines = [incompleteChunk, ...lines.slice(1)];
                    }

                    for (let line of lines) {
                        if (line.startsWith(`{"id":`)) {
                            let npmPkg = this._toJson(line);

                            if (typeof npmPkg !== "undefined") {
                                let [] = process.hrtime(startTime);
                                startTime = process.hrtime();

                                yield {
                                    offset,
                                    pkg: npmPkg,
                                    progress: [readBytes, fileSize]
                                };
                            }

                            offset++;
                        }
                    }

                    //save last line as new incomplete chunk
                    incompleteChunk = lastLine;
                }
            }
        } catch (e) {
            console.log(e);
        } finally {
            stream.close();
        }
    }

    //dumps all pkg metadata into the targetfolder
    //filename is pkg name unless it contains invalid char -> sha1 of pkg name is used instead
    async *savePackages(targetFolder: string): AsyncIterableIterator<IJsonSaveResult> {
        try {
            if (!fs.existsSync(this._jsonPath)) {
                throw `Source file "${this._jsonPath}" doesn't exist`;
            }

            if (!fs.existsSync(targetFolder)) {
                fs.mkdirSync(targetFolder, { recursive: true });
            }

            let startTime = process.hrtime();

            console.log(`Exploding "${this._jsonPath}" to "${targetFolder}"`);

            for await (let item of this.extractPackages()) {
                let progress = (item.progress[0] / item.progress[1]) * 100;

                let [s] = process.hrtime(startTime);
                let remainingSec = (100 / progress) * s - s;
                let [days, hours, minutes, seconds] = TimeEstimater.toDays(
                    /*mean.push(remainingSec)*/ remainingSec * 1000
                );
                let [runDays, runHours, runMinutes, runSeconds] = TimeEstimater.toDays(s * 1000);

                console.log(
                    item.offset,
                    `${progress.toFixed(2)}%`.padStart(7),
                    `${(JSON.stringify(item).length / 1024).toFixed(2)}kb`.padStart(11),
                    item.pkg.name.padEnd(64),
                    `~ remaining: ${days}d ${hours}h ${minutes}m ${seconds}s`.padEnd(32),
                    `running: ${runDays}d ${runHours}h ${runMinutes}m ${runSeconds}s`
                );

                let fileName = this._save(item, targetFolder);

                yield {
                    offset: item.offset,
                    pkg: item.pkg,
                    progress: item.progress,
                    destination: fileName
                };
            }
        } catch (e) {
            console.log(e);
        } finally {
        }
    }

    private _getFileName(pkgName: string, folder: string, gzip: boolean): string {
        let parts = pkgName.split("/");
        let suffix = gzip ? ".json.gzip" : ".json";

        if (parts.length === 1) {
            return path.join(folder, `${parts[0]}${suffix}`);
        }

        let fileName = `${parts.splice(-1)}${suffix}`;

        folder = path.join(folder, ...parts);
        fs.mkdirSync(folder, { recursive: true });

        return path.join(folder, fileName);
    }

    private _save(result: IJsonExtractResult, folder: string, gzip = false): string {
        let { pkg } = result;
        let fileName = this._getFileName(pkg.name, folder, gzip);
        const jsonStr = JSON.stringify(pkg);

        if (gzip) {
            fs.writeFileSync(fileName, zlib.gzipSync(jsonStr), "utf8");
        } else {
            fs.writeFileSync(fileName, jsonStr, "utf8");
        }

        return fileName;
    }

    private async _getOffset(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            try {
                const stream = fs.createReadStream(this._jsonPath);

                stream.on("readable", () => {
                    let chunk = stream.read();
                    let [first] = chunk.toString().split("\n") as string[];
                    let splits = first.split(":");
                    let token = splits[2];
                    let [number] = token.split(",");

                    stream.close();
                    resolve(parseInt(number));
                });
            } catch {
                reject(`Couldn't determine offset`);
            }
        });
    }

    private _toJson(str: string): INpmPackageInfo | undefined {
        interface IJsonObject {
            doc: INpmPackageInfo;
            id: string;
            key: string;
            value: {
                rev: string;
            };
        }

        let json: IJsonObject | undefined = undefined;

        //muhaha
        while (str !== "") {
            try {
                json = JSON.parse(str);

                break;
            } catch {
                str = str.slice(0, -1);
                continue;
            }
        }

        return typeof json === "undefined" ? undefined : json.doc;
    }
}

class TimeEstimater {
    private _i = 0;
    private _stackPointer = 0;
    private readonly _size = 64;
    private _stack: number[] = new Array(this._size);

    constructor(private _total: number) {}

    push(newTimeMs: number): [number, number, number, number] {
        this._i++;
        this._stack[this._stackPointer++] = newTimeMs;

        if (this._stackPointer >= this._size) {
            this._stackPointer = 0;
        }

        let sum = this._stack.reduce((a, b) => a + b, 0);
        let entries = this._stack.reduce(a => a + 1, 0);
        let mean = sum / entries;

        let remainingItems = this._total - this._i;
        let remainingTimeMs = remainingItems * mean;

        return TimeEstimater.toDays(remainingTimeMs);
    }

    static toDays(timeMs: number): [number, number, number, number] {
        let total_seconds = Math.floor(timeMs / 1000);
        let total_minutes = Math.floor(total_seconds / 60);
        let total_hours = Math.floor(total_minutes / 60);
        let days = Math.floor(total_hours / 24);

        let seconds = total_seconds % 60;
        let minutes = total_minutes % 60;
        let hours = total_hours % 24;

        return [days, hours, minutes, seconds];
    }
}
