import * as path from "path";
import * as fs from "fs";

import * as ts from "typescript";

import { INpmPackageVersion } from "../npm";
import { FileSystemPackageProvider } from "../providers/folder";

/* eslint-disable */
//istanbul ignore next
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
    resolveModuleNames(moduleNames: string[], containingFile: string): ts.ResolvedModule[] {
        console.log(13, moduleNames);

        return moduleNames.map<ts.ResolvedModule>(n => ({
            resolvedFileName: `${n}.js`,
            isExternalLibraryImport: false
        }));
    }
}

/* eslint-enable */

export class CodeAnalyzer {
    private _sourceFile: ts.SourceFile;
    private _statements = 0;
    private _imports = 0;
    private _exports = 0;
    private _importFiles: Set<string> = new Set();

    get imports(): number {
        //return getImports(this._sourceFile.getFullText()).size;
        return this._imports;
    }

    //todo refactor with imports()
    get importFiles(): ReadonlyArray<string> {
        return [...this._importFiles];
    }

    get exports(): number {
        return this._exports;
    }

    get statements(): number {
        return this._statements;
    }

    private constructor(private _src: string) {
        this._sourceFile = ts.createSourceFile(`_filename`, _src, ts.ScriptTarget.ESNext, true);

        this._walk();
    }

    private _walk(): void {
        const walk = (node: ts.Node) => {
            this._statements++;

            if (node.kind === ts.SyntaxKind.PropertyAccessExpression) {
                const [first, , third] = node.getChildren();

                if (first.getText() === `module` && third.getText() === `exports`) {
                    this._exports++;
                }
            }

            if (node.kind === ts.SyntaxKind.CallExpression) {
                const [first, , syntaxList] = node.getChildren();

                if (first.getText() === `require`) {
                    this._imports++;

                    this._importFiles.add(syntaxList.getText().slice(1, -1));
                }
            }

            ts.forEachChild(node, walk);
        };

        walk(this._sourceFile);
    }

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

interface ICodeStatistic {
    code: string;
    imports: Set<string>;
    permissions: Set<Permission>;
}

type CodeStatistics = Map<string, ICodeStatistic>;

function printPermissions(statistics: CodeStatistics): void {
    const permissions: Set<Permission> = new Set(
        ...[...statistics.values()].map(({ permissions }) => permissions)
    );

    for (const permission of permissions) {
        console.log(getPermissionString(permission));
    }
}

export function getImports(code: string): Set<string> {
    const imports: Set<string> = new Set<string>();
    const sourceFile = ts.createSourceFile(`_filename`, code, ts.ScriptTarget.ESNext, true);

    function visit(node: ts.Node): void {
        if (ts.isImportDeclaration(node)) {
            for (const child of node.getChildren()) {
                if (ts.isStringLiteral(child)) {
                    imports.add(child.text);
                }
            }
        } else if (ts.isCallExpression(node)) {
            const [name, , syntaxList] = node.getChildren();

            if (name.getText() === `import` || name.getText() === `require`) {
                const [arg] = syntaxList.getChildren();

                if (ts.isStringLiteral(arg)) {
                    imports.add(arg.text);
                }
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return imports;
}

function classifyImports(imports: Set<string>): Set<Permission> {
    const permissions: Set<Permission> = new Set<Permission>();

    for (const _import of imports) {
        switch (_import) {
            case "fs":
                permissions.add(Permission.Filesystem);
                break;
            case "http":
            case "http2":
            case "https":
            case "net":
            case "tls":
            case "dgram":
                permissions.add(Permission.Network);
                break;
        }
    }

    return permissions;
}

function getPermissionString(permission: Permission): string {
    let str: string = `Unknown permission ${permission.toString()}`;

    switch (permission) {
        case Permission.Filesystem:
            str = `Filesystem Access`;
            break;
        case Permission.Network:
            str = `Network Access`;
            break;
        default:
            const unhandled: never = permission;
    }

    return str;
}

const enum Permission {
    Filesystem,
    Network
}

export async function analyzePermissions(
    folder: string,
    provider: FileSystemPackageProvider
): Promise<string[]> {
    try {
        let files: string[] = [];

        const packagePath = getPackageJsonPath(folder);
        const packageJson = getPackageJson(packagePath);
        const { code, origin } = getMainFile(packagePath);
        const result = CodeAnalyzer.FromString(code);

        files.push(origin);

        for (const module of result.importFiles) {
            if (!isNativeModule(module)) {
                const [baseName, ...relative] = module.split("/");

                const version = packageJson.dependencies
                    ? packageJson.dependencies[baseName]
                    : undefined;

                if (typeof version == "undefined") {
                    const filePath = path.join(folder, module);

                    files.push(
                        ...(await analyzeLocalFile(folder, filePath, packageJson, provider))
                    );
                } else {
                    const pkg = await provider.getPackageByVersion(baseName, version);
                    const origin = provider.getOrigin(pkg.name, pkg.version);

                    if (relative.length > 0) {
                        const filePath = path.join(
                            path.dirname(origin),
                            ...relative.slice(0, -1),
                            `${relative[relative.length - 1]}.js`
                        );

                        files.push(
                            ...(await analyzeLocalFile(
                                path.dirname(origin),
                                filePath,
                                pkg,
                                provider
                            ))
                        );
                    } else {
                        files.push(...(await analyzePermissions(path.dirname(origin), provider)));
                    }
                }
            }
        }

        return files;
    } catch (e) {
        console.log(e);

        return [];
    }
}

async function analyzeLocalFile(
    folder: string,
    filePath: string,
    packageJson: INpmPackageVersion,
    provider: FileSystemPackageProvider
): Promise<string[]> {
    try {
        let files: string[] = [];
        const code = fs.readFileSync(filePath, "utf8");
        const result = CodeAnalyzer.FromString(code);

        files.push(filePath);
        for (const module of result.importFiles) {
            if (!isNativeModule(module)) {
                const [baseName, ...relative] = module.split("/");

                const version = packageJson.dependencies
                    ? packageJson.dependencies[baseName]
                    : undefined;

                if (typeof version == "undefined") {
                    const filePath = path.join(folder, `${module}.js`);

                    files.push(
                        ...(await analyzeLocalFile(folder, filePath, packageJson, provider))
                    );
                } else {
                    const pkg = await provider.getPackageByVersion(baseName, version);
                    const origin = provider.getOrigin(pkg.name, pkg.version);

                    if (relative.length > 0) {
                        const filePath = path.join(
                            path.dirname(origin),
                            ...relative.slice(0, -1),
                            `${relative[relative.length - 1]}.js`
                        );

                        files.push(
                            ...(await analyzeLocalFile(
                                path.dirname(origin),
                                filePath,
                                pkg,
                                provider
                            ))
                        );
                    } else {
                        files.push(...(await analyzePermissions(path.dirname(origin), provider)));
                    }
                }
            }
        }

        return files;
    } catch (e) {
        console.log(e);

        return [];
    }
}

interface IMainFile {
    code: string;
    origin: string;
}
function getMainFile(packagePath: string): IMainFile {
    const pkgJson: INpmPackageVersion = JSON.parse(fs.readFileSync(packagePath, "utf8"));

    if (typeof pkgJson.main === "undefined") {
        try {
            //try index.js fallback
            const indexJsPath = path.join(path.dirname(packagePath), `index.js`);

            return {
                code: fs.readFileSync(indexJsPath, "utf8"),
                origin: indexJsPath
            };
        } catch (e) {
            throw new Error(`Couldn't find main entry at ${packagePath}`);
        }
    } else {
        const mainPath = path.join(path.dirname(packagePath), pkgJson.main);

        return {
            code: fs.readFileSync(mainPath, "utf8"),
            origin: mainPath
        };
    }
}

function getPackageJsonPath(folder: string): string {
    const packagePath = path.join(folder, `package.json`);

    if (!fs.existsSync(packagePath))
        throw new Error(`Couldn't find package.json at "${packagePath}"`);

    return packagePath;
}

function getPackageJson(packagePath: string): INpmPackageVersion {
    return JSON.parse(fs.readFileSync(packagePath, "utf8"));
}

export function isNativeModule(modulePath: string): boolean {
    try {
        const result = require.resolve(modulePath);

        return result.endsWith(`.js`) ? false : true;
    } catch {
        return false;
    }
}
