"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.print = void 0;
var Markup;
(function (Markup) {
    Markup["Spacer"] = " ";
    Markup["HorizontalLine"] = "\u2500";
    Markup["VerticalLine"] = "\u251C";
    Markup["VerticalLineLeaf"] = "\u2514";
})(Markup || (Markup = {}));
const Leaf = `${Markup.VerticalLineLeaf}${Markup.HorizontalLine}${Markup.HorizontalLine}${Markup.Spacer}`;
const NonLeaf = `${Markup.VerticalLine}${Markup.HorizontalLine}${Markup.HorizontalLine}${Markup.Spacer}`;
function print(node, converter, formatter) {
    const lines = [];
    visit(node, converter, ``, lines);
    lines.forEach(line => formatter.writeLine(`${line}`));
}
exports.print = print;
function visit(node, converter, prefix, lines) {
    const label = converter.getLabel(node);
    const children = converter.getChildren(node);
    if (Array.isArray(label)) {
        for (const [i, entry] of label.entries()) {
            if (i === 0) {
                lines.push(`${prefix}${entry}`);
            }
            else {
                lines.push(`${adaptPrefix(prefix)}${entry}`);
            }
        }
    }
    else {
        lines.push(`${prefix}${label}`);
    }
    for (const [i, child] of children.entries()) {
        const identation = createIdentation(i + 1 === children.length);
        visit(child, converter, adaptPrefix(prefix) + identation, lines);
    }
}
//adapts the last part of a prefix for a new level
//e.g. changes '├──' to '│  ' and '└──' to '   '
function adaptPrefix(prefix) {
    const basePrefix = prefix.slice(0, -4);
    const lastIdentation = prefix.slice(-4);
    if (lastIdentation === Leaf) {
        const newIdentation = `    `;
        return `${basePrefix}${newIdentation}`;
    }
    else if (lastIdentation === NonLeaf) {
        const newIdentation = `│   `;
        return `${basePrefix}${newIdentation}`;
    }
    return prefix;
}
function createIdentation(isLast) {
    return isLast ? Leaf : NonLeaf;
}
//# sourceMappingURL=tree.js.map