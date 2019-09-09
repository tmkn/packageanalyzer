import * as ts from "typescript";

let example1 = `
module.exports = typeof queueMicrotask === 'function'
  ? queueMicrotask
  : typeof Promise === 'function'
    ? cb => Promise.resolve().then(cb)
    : cb => setTimeout(cb, 0) // fallback for Node 10 and old browsers
`;

let example2 = `
 
/*!
 * is-number <https://github.com/jonschlinkert/is-number>
 *
 * Copyright (c) 2014-present, Jon Schlinkert.
 * Released under the MIT License.
 */

'use strict';

module.exports = function(num) {
  if (typeof num === 'number') {
    return num - num === 0;
  }
  if (typeof num === 'string' && num.trim() !== '') {
    return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
  }
  return false;
};
`;

let example3 = `
module.exports.sayHelloInEnglish = function() {
    return "HELLO";
    };
    
    module.exports.sayHelloInSpanish = function() {
    return "Hola";
    };
`;

class InMemoryCompilerHost implements ts.CompilerHost {
    public files = new Map<string, string>();

    getSourceFile(
        fileName: string,
        languageVersion: ts.ScriptTarget,
        onError?: ((message: string) => void) | undefined,
        shouldCreateNewSourceFile?: boolean | undefined
    ): ts.SourceFile | undefined {
        const src = this.files.get(fileName);

        if (src) {
            return ts.createSourceFile(fileName, src, languageVersion);
        }
    }
    getDefaultLibFileName(options: ts.CompilerOptions): string {
        return "lib.d.ts";
    }
    writeFile(
        filename: string,
        data: string,
        writeByteOrderMark: boolean,
        onError?: (message: string) => void
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
    private _sourceFile: ts.SourceFile;
    private _statements = 0;

    private constructor(private _src: string) {
        this._sourceFile = ts.createSourceFile(`_filename`, _src, ts.ScriptTarget.ESNext, true);

        this._walk();
    }

    private _walk(): void {
        const walk = (node: ts.Node) => {
            this._statements++;

            if (node.kind === ts.SyntaxKind.PropertyAccessExpression) {
                const _node = node as ts.PropertyAccessExpression;
                const [first, , third] = _node.getChildren();

                if (first.getText() === `module` && third.getText() === `exports`) {
                    console.log(`export found!`);
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

    public statistics(): void {
        console.log(`todo statistics`);
        console.log(`Statements:`, this._statements);
    }
}

let test = CodeAnalyzer.FromString(example3);

test.statistics();
