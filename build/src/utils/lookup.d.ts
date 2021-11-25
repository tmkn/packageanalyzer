export interface ILookupEntry {
    readonly name: string;
    readonly offset: number;
    readonly length: number;
    readonly line: number;
}
export declare class LookupFileCreator {
    private _filePath;
    private _lookups;
    get lookups(): ReadonlyArray<ILookupEntry>;
    constructor(_filePath: string);
    parse(): Promise<void>;
}
export declare function createLookupFile(srcFile: string): Promise<void>;
export declare class LookupFileWriter {
    private _targetFile;
    private _lookups;
    constructor(_targetFile: string, _lookups: ReadonlyArray<ILookupEntry>);
    static getLine({ name, offset, length }: ILookupEntry): string;
    write(): void;
}
//# sourceMappingURL=lookup.d.ts.map