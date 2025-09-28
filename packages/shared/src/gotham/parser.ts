import { parseSync, Visitor } from "oxc-parser";

export function findImports(fileName: string, code: string, moduleNames: string[]): Set<string> {
    const result = parseSync(fileName, code);
    const foundModules: Set<string> = new Set();
    const aliasMap: Map<string, string> = new Map();

    const visitor = new Visitor({
        // track variable declarations for aliased requires
        VariableDeclarator(node) {
            if (
                node.id.type === "Identifier" &&
                node.init &&
                node.init.type === "Literal" &&
                typeof node.init.value === "string"
            ) {
                aliasMap.set(node.id.name, node.init.value);
            }
        },
        // finds import foo from 'bar'
        ImportDeclaration(node) {
            if (node.source && moduleNames.includes(node.source.value)) {
                foundModules.add(node.source.value);
            }
        },
        // finds dynamic imports
        ImportExpression(node) {
            if (node.source && node.source.type === "Literal") {
                const value = node.source.value?.toString();

                if (value && moduleNames.includes(value)) {
                    foundModules.add(value);
                }
            } else if (node.source.type === "Identifier") {
                const aliasValue = aliasMap.get(node.source.name);
                if (aliasValue && moduleNames.includes(aliasValue)) {
                    foundModules.add(aliasValue);
                }
            }
        },
        CallExpression(node) {
            if (
                node.callee.type === "Identifier" &&
                node.callee.name === "require" &&
                node.arguments.length > 0
            ) {
                const arg = node.arguments[0];
                if (arg && arg.type === "Literal") {
                    const value = arg.value?.toString();
                    if (value && moduleNames.includes(value)) {
                        foundModules.add(value);
                    }
                } else if (arg && arg.type === "Identifier") {
                    const aliasValue = aliasMap.get(arg.name);
                    if (aliasValue && moduleNames.includes(aliasValue)) {
                        foundModules.add(aliasValue);
                    }
                }
            }
        }
    });

    visitor.visit(result.program);

    return foundModules;
}

export function findEvals(fileName: string, code: string): boolean {
    const result = parseSync(fileName, code);
    let foundEval = false;

    const visitor = new Visitor({
        // catch eval
        CallExpression(node) {
            if (node.callee.type === "Identifier" && node.callee.name === "eval") {
                foundEval = true;
            }
        },

        // catch aliased eval
        Identifier(node) {
            if (node.name === "eval") {
                foundEval = true;
            }
        }
    });

    visitor.visit(result.program);

    return foundEval;
}
