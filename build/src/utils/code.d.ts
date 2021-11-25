export declare class CodeAnalyzer {
    private _src;
    private _sourceFile;
    private _statements;
    private _imports;
    private _exports;
    get imports(): number;
    get exports(): number;
    get statements(): number;
    private constructor();
    private _walk;
    static FromString(src: string): CodeAnalyzer;
    statistics(): void;
}
//# sourceMappingURL=code.d.ts.map