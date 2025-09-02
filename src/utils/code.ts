import * as ts from "typescript";
 
//istanbul ignore next
class InMemoryCompilerHost implements ts.CompilerHost {
    public files = new Map<string, string>();

    getSourceFile(
        fileName: string,
        languageVersion: ts.ScriptTarget,
        _onError?: ((message: string) => void) | undefined,
        _shouldCreateNewSourceFile?: boolean | undefined
    ): ts.SourceFile | undefined {
        const src = this.files.get(fileName);

        if (src) {
            return ts.createSourceFile(fileName, src, languageVersion);
        }
    }
    getDefaultLibFileName(_options: ts.CompilerOptions): string {
        return "lib.d.ts";
    }
    writeFile(
        _filename: string,
        _data: string,
        _writeByteOrderMark: boolean,
        _onError?: (message: string) => void
    ) {
        console.log("writeFile not implemented");
    }
    getCurrentDirectory(): string {
        return "";
    }
    getCanonicalFileName(fileName: string): string {
        return fileName;
    }
    useCaseSensitiveFileNames(): boolean {
        return true;
    }
    getNewLine(): string {
        return "\n";
    }
    fileExists(fileName: string): boolean {
        return this.files.has(fileName);
    }
    readFile(fileName: string): string | undefined {
        return this.files.get(fileName);
    }
}
 

export class CodeAnalyzer {
    private readonly _sourceFile: ts.SourceFile;
    private _statements = 0;
    private _imports = 0;
    private _exports = 0;

    get imports(): number {
        return this._imports;
    }

    get exports(): number {
        return this._exports;
    }

    get statements(): number {
        return this._statements;
    }

    private constructor(private readonly _src: string) {
        this._sourceFile = ts.createSourceFile(`_filename`, _src, ts.ScriptTarget.ESNext, true);

        this._walk();
    }

    private _walk(): void {
        const walk = (node: ts.Node) => {
            this._statements++;

            if (node.kind === ts.SyntaxKind.PropertyAccessExpression) {
                const [first, , third] = node.getChildren();

                if (first?.getText() === `module` && third?.getText() === `exports`) {
                    this._exports++;
                }
            }

            if (node.kind === ts.SyntaxKind.CallExpression) {
                const [first] = node.getChildren();

                if (first?.getText() === `require`) {
                    this._imports++;
                }
            }

            ts.forEachChild(node, walk);
        };

        walk(this._sourceFile);
    }

    /*public static FromFile(filePath: string): CodeAnalyzer {
        throw new Error(`Not Implemented`);
    }*/

    public static FromString(src: string): CodeAnalyzer {
        return new CodeAnalyzer(src);
    }

    //istanbul ignore next
    public statistics(): void {
        console.log(`todo statistics`);
        console.log(`Statements:`, this._statements);
        console.log(`Imports:`, this._imports);
        console.log(`Exports:`, this._exports);
    }
}
