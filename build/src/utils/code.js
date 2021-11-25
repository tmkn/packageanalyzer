"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeAnalyzer = void 0;
const ts = require("typescript");
/* eslint-disable */
//istanbul ignore next
class InMemoryCompilerHost {
    constructor() {
        this.files = new Map();
    }
    getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile) {
        const src = this.files.get(fileName);
        if (src) {
            return ts.createSourceFile(fileName, src, languageVersion);
        }
    }
    getDefaultLibFileName(options) {
        return "lib.d.ts";
    }
    writeFile(filename, data, writeByteOrderMark, onError) {
        console.log("writeFile not implemented");
    }
    getCurrentDirectory() {
        return "";
    }
    getCanonicalFileName(fileName) {
        return fileName;
    }
    useCaseSensitiveFileNames() {
        return true;
    }
    getNewLine() {
        return "\n";
    }
    fileExists(fileName) {
        return this.files.has(fileName);
    }
    readFile(fileName) {
        return this.files.get(fileName);
    }
}
/* eslint-enable */
class CodeAnalyzer {
    constructor(_src) {
        this._src = _src;
        this._statements = 0;
        this._imports = 0;
        this._exports = 0;
        this._sourceFile = ts.createSourceFile(`_filename`, _src, ts.ScriptTarget.ESNext, true);
        this._walk();
    }
    get imports() {
        return this._imports;
    }
    get exports() {
        return this._exports;
    }
    get statements() {
        return this._statements;
    }
    _walk() {
        const walk = (node) => {
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
    static FromString(src) {
        return new CodeAnalyzer(src);
    }
    //istanbul ignore next
    statistics() {
        console.log(`todo statistics`);
        console.log(`Statements:`, this._statements);
        console.log(`Imports:`, this._imports);
        console.log(`Exports:`, this._exports);
    }
}
exports.CodeAnalyzer = CodeAnalyzer;
//# sourceMappingURL=code.js.map