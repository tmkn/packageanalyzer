import { IPackageJson, IPackageMetadata, IUnpublishedPackageMetadata } from "../npm";
import { PackageVersion } from "../visitors/visitor";
import { IPackageJsonProvider } from "./provider";
export declare class FlatFileProvider implements IPackageJsonProvider {
    private _file;
    private _lookup;
    private _lookupFile;
    private _cache;
    private _initialized;
    private _logger;
    static getLookupFile(npmFile: string): string;
    constructor(_file: string);
    getPackageInfo(name: string): Promise<IPackageMetadata | IUnpublishedPackageMetadata | undefined>;
    getPackageJson(name: string, version?: string): Promise<IPackageJson>;
    getPackageJsons(modules: PackageVersion[]): AsyncIterableIterator<IPackageJson>;
    parseLookupFile(): Promise<void>;
    private _parseLine;
    private _getPackage;
    private _getFromLookup;
    private _getFromCache;
}
export declare function getPercentage(current: number, total: number): string;
//# sourceMappingURL=flatFile.d.ts.map