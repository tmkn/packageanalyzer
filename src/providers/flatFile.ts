import * as readline from "readline";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as semver from "semver";

import { OraLogger } from "../utils/logger";

import { IPackageVersionProvider } from "./folder";
import { INpmPackageVersion, INpmPackage, INpmDumpRow, IUnpublishedNpmPackage } from "../npm";
import { PackageVersion } from "../visitors/visitor";

//parses npm data from https://replicate.npmjs.com/_all_docs?limit=4&include_docs=true
//needs a lookup file
export class FlatFileProvider implements IPackageVersionProvider {
    private _lookup: Map<string, ILookupInfo> = new Map();
    private _lookupFile: string;
    private _cache: Map<string, INpmPackage> = new Map();
    private _initialized = false;
    private _logger = new OraLogger();

    public static getLookupFile(npmFile: string): string {
        try {
            const baseName = path.basename(npmFile, path.extname(npmFile));
            const folder = path.dirname(npmFile);

            return path.join(folder, `${baseName}.lookup.txt`);
        } catch (e) {
            throw new Error(`Couldn't find lookup file for ${npmFile}`);
        }
    }

    get size(): number {
        return this._lookup.size;
    }

    constructor(private _file: string) {
        this._lookupFile = FlatFileProvider.getLookupFile(this._file);
    }

    async getPackageInfo(name: string): Promise<INpmPackage | IUnpublishedNpmPackage | undefined> {
        return this._getPackage(name);
    }

    async getPackageByVersion(name: string, version?: string): Promise<INpmPackageVersion> {
        if (!this._initialized) {
            await this.parseLookupFile();
            this._initialized = true;
        }

        const pkgInfo = this._getPackage(name);

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

    async *getPackagesByVersion(
        modules: PackageVersion[]
    ): AsyncIterableIterator<INpmPackageVersion> {
        for (const [name, version] of modules) {
            yield this.getPackageByVersion(name, version);
        }
    }

    async parseLookupFile(): Promise<void> {
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
            parsedBytes += Buffer.byteLength(line, "utf8");
            const name = this._parseLine(line, ++lineNum);

            this._logger.log(`Parsing Lookup [${getPercentage(parsedBytes, fileSize)}%] ${name}`);
        }
        this._logger.stop();
    }

    private _parseLine(line: string, lineNum: number): string {
        const [name, offset, length] = line.split(" ").map(l => l.trim());
        const _offset: number = parseInt(offset);
        const _length: number = parseInt(length);
        //due to the way newlines are interpreted between different os, we need to correct the offset
        //basically if win add +1 for every newline since win -> \r\n -> 2char, *nix -> \n -> 1char
        const correctedOffset = os.platform() !== "win32" ? _offset : _offset + lineNum;
        const lookup: ILookupInfo = {
            offset: correctedOffset,
            length: _length
        };

        this._lookup.set(name, lookup);

        return name;
    }

    private _getPackage(name: string): INpmPackage {
        const cachedPkg = this._getFromCache(name);

        if (typeof cachedPkg !== "undefined") return cachedPkg;

        return this._getFromLookup(name);
    }

    private _getFromLookup(pkgName: string): INpmPackage {
        const lookupInfo = this._lookup.get(pkgName);

        if (typeof lookupInfo === "undefined")
            throw new Error(`Couldn't finde package "${pkgName}"`);

        const { offset, length } = lookupInfo;
        const fd = fs.openSync(this._file, "r");
        const buffer = Buffer.alloc(length);

        fs.readSync(fd, buffer, 0, length, offset);
        fs.closeSync(fd);

        const { doc: pkg }: INpmDumpRow = JSON.parse(buffer.toString());

        this._cache.set(pkgName, pkg);

        return pkg;
    }

    private _getFromCache(pkgName: string): INpmPackage | undefined {
        return this._cache.get(pkgName);
    }
}

interface ILookupInfo {
    readonly offset: number;
    readonly length: number;
}

export function getPercentage(current: number, total: number): string {
    const progress: number = (current / total) * 100;

    return `${progress.toFixed(2).padStart(6)}`;
}
