import * as path from "path";

import { PackageAnalytics } from "./analyzers/package";
import { FileSystemPackageProvider } from "./providers/folder";
import { Resolver } from "./resolvers/resolver";
import { OraLogger } from "./logger";
import { fromFolder } from "./resolvers/folder";

enum Markup {
    Spacing = "-",
    NonLeaf = "|",
    Leaf = "`"
}

(async () => {
    function analytics2TreeTransformer(data: PackageAnalytics): IConsoleTreeData {
        let root: IConsoleTreeData = {
            label: data.name,
            children: []
        };

        for(const dependency of data.directDependencies) {
            if(root.children)
                root.children.push(analytics2TreeTransformer(dependency));
        }

        return root;
    }

    interface IConsoleTreeData {
        label: string;
        children?: Array<IConsoleTreeData>;
    }

    class ConsoleTreeBuilder<T> {
        private readonly _transformedData: IConsoleTreeData;

        constructor(private _data: T, private _transformer: (data: T) => IConsoleTreeData) {
            this._transformedData = _transformer(_data);
        }

        asLines(): string[] {
            let lines: string[] = [this._transformedData.label];

            if(this._transformedData.children) {
                lines.push(...this._create(this._transformedData.children));
            }

            return lines;
        }

        private _create(children: IConsoleTreeData[], level = 1): string[] {
            const length = children.length;
            let lines: string[] = [];

            for(const [i, child] of children.entries()) {
                if (i === length - 1) {
                    lines.push(`${this._identation(level)}${Markup.Leaf}${Markup.Spacing}${Markup.Spacing} ${child.label}`);
                } else {
                    lines.push(`${this._identation(level)}${Markup.NonLeaf}${Markup.Spacing}${Markup.Spacing} ${child.label}`);
                }

                if(child.children) {
                    lines.push(...this._create(child.children, level + 1));
                }
            }

            return lines;
        }

        print(): void {
            for(const line of this.asLines()) {
                console.log(line);
            }
        }

        private _identation(levels: number): string {
            return new Array(levels).fill(" ").join("");
        }
    }

    const rootPath = path.join("tests", "data", "testproject1");
    const provider = new FileSystemPackageProvider(rootPath);
    const resolver = new Resolver(fromFolder(rootPath), provider, new OraLogger());
    const pa = await resolver.resolve();
    const consoleTree = new ConsoleTreeBuilder(pa, analytics2TreeTransformer);

    consoleTree.print();
})();
