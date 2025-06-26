import * as path from "path";
import * as fs from "fs";

import { FlatFileProvider } from "../providers/flatFile.js";
import { OraLogger } from "../loggers/OraLogger.js";
import { type IPackage } from "../package/package.js";
import { getPackageVersionfromString, type PackageVersion, Visitor } from "../visitors/visitor.js";

type Formatter = (p: IPackage) => object;
type ExtractCallback = (data: string, p: IPackage, i: number, max: number) => Promise<void>;

//extract packages from dump file
export class Extractor {
    private _provider: FlatFileProvider;
    private _versions: PackageVersion[] = [];
    private _resolvedPackages: Map<string, IPackage> = new Map();

    /* istanbul ignore next */
    static async Extract(
        inputFile: string,
        npmFile: string,
        targetDir: string,
        formatter: Formatter
    ): Promise<void> {
        const extractor = new Extractor(inputFile, npmFile);

        await extractor.extract();
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

        await extractor.save(formatter, async (data, p, i, max) => {
            const padding = `${i + 1}`.padStart(max.toString().length);
            const partialDir = Extractor.PackageNameToDir(p.fullName);
            const packageDir = path.join(targetDir, partialDir);
            const fileName =
                partialDir.length > 0
                    ? `${p.fullName}.json`.split(partialDir)[1]
                    : `${p.fullName}.json`;

            if (!fileName) throw new Error(`fileName is undefined`);

            const filePath = path.join(packageDir, fileName);

            if (!fs.existsSync(packageDir)) fs.mkdirSync(packageDir, { recursive: true });

            process.stdout.write(`[${padding}/${max}] ${filePath}\n`);
            fs.writeFileSync(filePath, data, "utf8");
        });

        extractor.writeLookupFile(path.join(targetDir, `lookup.txt`));
    }

    //get the dir part from a pkg name to save it correctly
    static PackageNameToDir(pkgName: string): string {
        const [name] = getPackageVersionfromString(pkgName);

        if (name.startsWith(`@`)) {
            const token = name.split("/")[0];

            if (!token) throw new Error(`Couldn't get package dir`);

            return token;
        }

        return "";
    }

    constructor(
        private readonly _inputFile: string,
        private readonly _npmFile: string
    ) {
        this._provider = new FlatFileProvider(this._npmFile);

        this._parseInputFile();
    }

    private _parseInputFile(): void {
        const content = fs.readFileSync(this._inputFile, "utf8");
        const packageNames: string[] = JSON.parse(content);

        if (!Array.isArray(packageNames)) throw new Error(`input data is not an array!`);

        this._versions = [];
        for (const name of packageNames) {
            this._versions.push(getPackageVersionfromString(name));
        }
    }

    async extract(): Promise<ReadonlyMap<string, IPackage>> {
        this._resolvedPackages = new Map();

        for (const [name, version] of this._versions) {
            const versionStr: string = version ?? `latest`;
            process.stdout.write(`Fetching ${name}@${versionStr}\n`);

            const visitor = new Visitor([name, version], this._provider, new OraLogger());
            const p: IPackage = await visitor.visit();

            if (!this._resolvedPackages.has(p.fullName)) {
                this._resolvedPackages.set(p.fullName, p);

                //add distinct dependencies
                p.visit(dep => {
                    if (!this._resolvedPackages.has(dep.fullName))
                        this._resolvedPackages.set(dep.fullName, dep);
                });
            }
        }

        return this._resolvedPackages;
    }

    /* istanbul ignore next */
    writeLookupFile(lookupDestination: string): void {
        const fd = fs.openSync(lookupDestination, "w");

        process.stdout.write(`Writing lookup file...\n`);

        for (const entry of this._resolvedPackages.keys()) {
            fs.writeSync(fd, `${entry}\n`, null, "utf8");
        }

        fs.closeSync(fd);

        process.stdout.write(`Generated lookup file at ${lookupDestination}\n`);
    }

    /* istanbul ignore next */
    async save(formatter: Formatter, saveCallback: ExtractCallback): Promise<void> {
        try {
            let i = 0;

            for (const p of this._resolvedPackages.values()) {
                const jsonData = JSON.stringify(formatter(p));

                await saveCallback(jsonData, p, i++, this._resolvedPackages.size);
            }
        } catch (e) {
            process.stderr.write(`${e}`);
            throw new Error(`Couldn't save`);
        }
    }
}
