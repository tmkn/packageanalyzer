import { parseSync, visitorKeys, type Node } from "oxc-parser";

export class CodeAnalyzer {
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

    private constructor(src: string) {
        const { program } = parseSync(`_filename.ts`, src, { sourceType: `unambiguous` });
        this._walk(program);
    }

    private _walk(sourceFile: Node): void {
        const walk = (node: Node): void => {
            this._statements++;

            if (
                node.type === `MemberExpression` &&
                !node.computed &&
                node.object.type === `Identifier` &&
                node.object.name === `module` &&
                node.property.type === `Identifier` &&
                node.property.name === `exports`
            ) {
                this._exports++;
            }

            if (
                node.type === `CallExpression` &&
                node.callee.type === `Identifier` &&
                node.callee.name === `require`
            ) {
                this._imports++;
            }

            for (const key of visitorKeys[node.type] ?? []) {
                const child = (node as unknown as Record<string, Node | Node[] | null>)[key];

                if (Array.isArray(child)) {
                    child.forEach(walk);
                } else if (child) {
                    walk(child);
                }
            }
        };

        walk(sourceFile);
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
