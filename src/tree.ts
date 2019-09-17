import * as path from "path";

import { PackageAnalytics } from "./analyzers/package";
import { FileSystemPackageProvider } from "./providers/folder";
import { Resolver } from "./resolvers/resolver";
import { OraLogger } from "./logger";
import { fromFolder } from "./resolvers/folder";

//todo

enum Markup {
    Spacing = "-",
    NonLeaf = "|",
    Leaf = "`"
}

const SpacingWidth = 2;

(async () => {
    function analytics2TreeTransformer(data: PackageAnalytics): IConsoleTreeData {
        let root: IConsoleTreeData = {
            label: data.name,
            children: []
        };

        data.visit(dep => {
            if (root.children) {
                root.children.push({ label: dep.fullName });
            }
        }, false);

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

            if (this._transformedData.children) {
                const length = this._transformedData.children.length;

                this._transformedData.children.forEach((c, i) => {
                    if (i === length - 1) {
                        lines.push(`${Markup.Leaf}-- ${c.label}`);
                    } else {
                        lines.push(`${Markup.NonLeaf}-- ${c.label}`);
                    }
                });
            }

            return lines;
        }
    }

    const rootPath = path.join("tests", "data", "testproject1");
    const provider = new FileSystemPackageProvider(rootPath);
    const resolver = new Resolver(fromFolder(rootPath), provider, new OraLogger());
    const pa = await resolver.resolve();
    const consoleTree = new ConsoleTreeBuilder(pa, analytics2TreeTransformer);
    const lines = consoleTree.asLines();

    for (const line of lines) {
        console.log(line);
    }
})();
