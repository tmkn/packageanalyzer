import * as path from "path";

import { PackageAnalytics } from "./analyzers/package";
import { FileSystemPackageProvider } from "./providers/folder";
import { OraLogger } from "./logger";
import { getPackageJson } from "./visitors/folder";
import { Visitor } from "./visitors/visitor";

enum Markup {
    Spacer = ` `,
    HorizontalLine = `─`,
    VerticalLine = `├`,
    VerticalLineLeaf = `└`
}

const Leaf = `${Markup.VerticalLineLeaf}${Markup.HorizontalLine}${Markup.HorizontalLine}${Markup.Spacer}`;
const NonLeaf = `${Markup.VerticalLine}${Markup.HorizontalLine}${Markup.HorizontalLine}${Markup.Spacer}`;

interface ITransformer<T> {
    getLabel(data: T): string;
    getChildren(data: T): T[];
}

function print<T>(entry: T, converter: ITransformer<T>): void {
    visit(entry, converter, ``);
}

function visit<T>(entry: T, converter: ITransformer<T>, prefix: string): void {
    const label = converter.getLabel(entry);
    const children = converter.getChildren(entry);

    console.log(`${prefix}${label}`);

    for (const [i, child] of children.entries()) {
        const identation = createIdentation(i + 1 === children.length);

        visit(child, converter, adaptPrefix(prefix) + identation);
    }
}

//adapts the last part of a prefix for a new level
//e.g. changes '├──' to '│  ' and '└──' to '   '
function adaptPrefix(prefix: string): string {
    const basePrefix = prefix.slice(0, -4);
    const lastIdentation = prefix.slice(-4);

    if (lastIdentation === Leaf) {
        const newIdentation = `    `;

        return `${basePrefix}${newIdentation}`;
    } else if (lastIdentation === NonLeaf) {
        const newIdentation = `│   `;

        return `${basePrefix}${newIdentation}`;
    }

    return prefix;
}

function createIdentation(isLast: boolean): string {
    return isLast ? Leaf : NonLeaf;
}

(async () => {
    const rootPath = path.join("tests", "data", "testproject1");
    const provider = new FileSystemPackageProvider(rootPath);
    const visitor = new Visitor(getPackageJson(rootPath), provider, new OraLogger());
    const pa = await visitor.visit();

    const converter: ITransformer<PackageAnalytics> = {
        getLabel: data => data.fullName,
        getChildren: data => data.directDependencies
    };

    print<PackageAnalytics>(pa, converter);
})();
