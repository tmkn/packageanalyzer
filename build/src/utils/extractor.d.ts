import { Package } from "../package/package";
declare type Formatter = (p: Package) => object;
declare type ExtractCallback = (data: string, p: Package, i: number, max: number) => Promise<void>;
export declare class Extractor {
    private readonly _inputFile;
    private readonly _npmFile;
    private _provider;
    private _versions;
    private _resolvedPackages;
    static Extract(inputFile: string, npmFile: string, targetDir: string, formatter: Formatter): Promise<void>;
    static PackageNameToDir(pkgName: string): string;
    constructor(_inputFile: string, _npmFile: string);
    private _parseInputFile;
    extract(): Promise<ReadonlyMap<string, Package>>;
    writeLookupFile(lookupDestination: string): void;
    save(formatter: Formatter, saveCallback: ExtractCallback): Promise<void>;
}
export {};
//# sourceMappingURL=extractor.d.ts.map