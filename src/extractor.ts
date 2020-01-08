import * as path from "path";
import * as fs from "fs";

import { FlatFileProvider } from "./providers/flatFile";
import { PackageVersion, getNameAndVersion } from "./npm";
import { OraLogger } from "./logger";
import { PackageAnalytics } from "./analyzers/package";
import { Visitor } from "./visitors/visitor";

type Formatter = <T extends object>(pa: PackageAnalytics) => T;
type ExtractCallback = (
    data: string,
    pa: PackageAnalytics,
    i: number,
    max: number
) => Promise<void>;

//extract packages from dump file
export class Extractor {
    private _provider: FlatFileProvider;
    private _versions: PackageVersion[] = [];
    private _analytics: PackageAnalytics[] = [];
    private _resolvedVersions: Set<string> = new Set();

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

        extractor.save(formatter, async (data, pa, i, max) => {
            const padding = `${i + 1}`.padStart(max.toString().length);
            const partialDir = Extractor.PackageNameToDir(pa.fullName);
            const packageDir = path.join(targetDir, partialDir);

            if (!fs.existsSync(packageDir)) fs.mkdirSync(packageDir, { recursive: true });

            const filePath = path.join(packageDir, `${pa.fullName}.json`);

            if (fs.existsSync(filePath)) {
                console.log(`[${padding}/${max}] ${filePath} - Skipped`);
            } else {
                console.log(`[${padding}/${max}] ${filePath}`);
                fs.writeFileSync(filePath, data, "utf8");
            }
        });

        extractor.writeLookupFile(path.join(targetDir, `lookup.txt`));
    }

    //get the dir part from a pkg name to save it correctly
    static PackageNameToDir(pkgName: string): string {
        const [name] = getNameAndVersion(pkgName);

        if (name.startsWith(`@`)) {
            return name.split("/")[0];
        }

        return "";
    }

    constructor(private readonly _inputFile: string, private readonly _npmFile: string) {
        this._provider = new FlatFileProvider(this._npmFile);

        this._parseInputFile();
    }

    private _parseInputFile(): void {
        const content = fs.readFileSync(this._inputFile, "utf8");
        const modules: string[] = JSON.parse(content);

        if (!Array.isArray(modules)) throw new Error(`input data is not an array!`);

        this._versions = [];
        for (const module of modules) {
            this._versions.push(getNameAndVersion(module));
        }
    }

    async extract(): Promise<ReadonlyArray<PackageAnalytics>> {
        this._analytics = [];

        for (const [name, version] of this._versions) {
            console.log(`Fetching ${name}@${version ? version : `latest`}`);

            const visitor = new Visitor([name, version], this._provider, new OraLogger());
            const pa: PackageAnalytics = await visitor.visit();

            this._analytics.push(pa);

            this._resolvedVersions.add(pa.fullName);
        }

        return this._analytics;
    }

    /* istanbul ignore next */
    writeLookupFile(lookupDestination: string): void {
        const fd = fs.openSync(lookupDestination, "w");

        console.log(`Writing lookup file...`);

        for (const entry of this._resolvedVersions) {
            fs.writeSync(fd, `${entry}\n`, null, "utf8");
        }

        fs.closeSync(fd);

        console.log(`Generated lookup file at ${lookupDestination}`);
    }

    /* istanbul ignore next */
    async save(formatter: Formatter, saveCallback: ExtractCallback): Promise<void> {
        try {
            const allDependencyCount = [...this._analytics].reduce<number>(
                (prev, pa) => (prev += pa.transitiveDependenciesCount + 1),
                0
            );
            let i = 0;

            for (const pa of this._analytics) {
                pa.visit(async _pa => {
                    const jsonData = JSON.stringify(formatter(_pa));

                    await saveCallback(jsonData, _pa, i++, allDependencyCount);
                }, true);
            }
        } catch (e) {
            console.log(e);
            throw new Error(`Couldn't save`);
        }
    }
}
