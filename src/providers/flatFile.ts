import * as readline from "readline";
import * as fs from "fs";
import * as os from "os";
import * as semver from "semver";

import { IPackageProvider } from "./folder";
import { INpmPackage, PackageVersion, INpmPackageInfo, INpmDumpRow } from "../npm";

//parses npm data from https://replicate.npmjs.com/_all_docs?limit=4&include_docs=true
//needs a lookup file
export class FlatFileProvider implements IPackageProvider {
    private _lookup: Map<string, ILookupInfo> = new Map();
    private _initialized = false;

    get size(): number {
        return this._lookup.size;
    }

    constructor(private _file: string, private _lookupFile: string) {}

    async getPackageByVersion(name: string, version?: string): Promise<INpmPackage> {
        if (!this._initialized) {
            await this.parseLookupFile();
            this._initialized = true;
        }

        const pkgInfo = this._getPackageInfo(name);

        //get latest version
        if (typeof version === "undefined") {
            const latest = pkgInfo["dist-tags"].latest;

            return pkgInfo.versions[latest];
        }
        //get specific version
        else {
            const versions: string[] = [...Object.keys(pkgInfo.versions)];
            const resolvedVersion = semver.maxSatisfying(versions, version);

            if (resolvedVersion === null) {
                throw new Error(`Couldn't resolve ${version} for ${name}`);
            }

            return pkgInfo.versions[resolvedVersion];
        }
    }

    async *getPackagesByVersion(modules: PackageVersion[]): AsyncIterableIterator<INpmPackage> {
        for (const [name, version] of modules) {
            yield this.getPackageByVersion(name, version);
        }
    }

    async parseLookupFile(): Promise<void> {
        const rl = readline.createInterface({
            input: fs.createReadStream(this._lookupFile),
            crlfDelay: Infinity
        });

        this._lookup.clear();

        for await (const line of rl) {
            this._addToLookup(line);
        }
    }

    private _addToLookup(line: string): void {
        const [name, offset, length] = line.split(" ").map(l => l.trim());
        const _offset: number = parseInt(offset);
        const _length: number = parseInt(length);
        //due to the way newlines are interpreted between different os, we need to correct the offset
        //lookup file was generated on windows
        //win -> \r\n -> 2char, *nix -> \n -> 1char
        const correctedOffset = os.platform() !== "win32" ? _offset - this.size - 1 : _offset;

        this._lookup.set(name, {
            offset: correctedOffset,
            length: _length
        });
    }

    private _getPackageInfo(name: string): INpmPackageInfo {
        const lookupInfo = this._lookup.get(name);

        if (typeof lookupInfo === "undefined") throw new Error(`Couldn't finde package "${name}"`);

        const { offset, length } = lookupInfo;
        const fd = fs.openSync(this._file, "r");
        const buffer = Buffer.alloc(length);

        fs.readSync(fd, buffer, 0, length, offset);

        const json: INpmDumpRow = JSON.parse(buffer.toString());

        return json.doc;
    }
}

interface ILookupInfo {
    readonly offset: number;
    readonly length: number;
}
