import { type IFormatter } from "./formatter.js";

enum Markup {
    Spacer = ` `,
    HorizontalLine = `─`,
    VerticalLine = `├`,
    VerticalLineLeaf = `└`
}

const Leaf = `${Markup.VerticalLineLeaf}${Markup.HorizontalLine}${Markup.HorizontalLine}${Markup.Spacer}`;
const NonLeaf = `${Markup.VerticalLine}${Markup.HorizontalLine}${Markup.HorizontalLine}${Markup.Spacer}`;

export interface ITreeFormatter<T> {
    getLabel(data: T): string | string[];
    getChildren(data: T): T[];
}

export function print<T>(node: T, converter: ITreeFormatter<T>, formatter: IFormatter): void {
    const lines: string[] = [];

    visit(node, converter, ``, lines);
    lines.forEach(line => formatter.writeLine(`${line}`));
}

function visit<T>(node: T, converter: ITreeFormatter<T>, prefix: string, lines: string[]): void {
    const label = converter.getLabel(node);
    const children = converter.getChildren(node);

    if (Array.isArray(label)) {
        for (const [i, entry] of label.entries()) {
            if (i === 0) {
                lines.push(`${prefix}${entry}`);
            } else {
                lines.push(`${adaptPrefix(prefix)}${entry}`);
            }
        }
    } else {
        lines.push(`${prefix}${label}`);
    }

    for (const [i, child] of children.entries()) {
        const isLast = i + 1 === children.length;
        const identation = isLast ? Leaf : NonLeaf;

        visit(child, converter, adaptPrefix(prefix) + identation, lines);
    }
}

//adapts the last part of a prefix for a new level
//e.g. changes '├──' to '│  ' and '└──' to '    '
function adaptPrefix(prefix: string): string {
    const basePrefix = prefix.slice(0, -4);
    const lastIdentation = prefix.slice(-4);

    if (lastIdentation === Leaf) {
        const newIdentation = `    `;

        return `${basePrefix}${newIdentation}`;
    } else if (lastIdentation === NonLeaf) {
        const newIdentation = `│   `;

        return `${basePrefix}${newIdentation}`;
    }

    return prefix;
}
