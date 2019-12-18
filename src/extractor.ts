import * as path from "path";
import * as fs from "fs";

import { FlatFileProvider } from "./providers/flatFile";
import { PackageVersion, getNameAndVersion } from "./npm";
import { OraLogger } from "./logger";
import { PackageAnalytics } from "./analyzers/package";
import { Resolver } from "./resolvers/resolver";

//extract packages from dump file
export class Extractor {
    private _provider: FlatFileProvider;
    private _versions: PackageVersion[] = [];
    private _analytics: PackageAnalytics[] = [];

    /* istanbul ignore next */
    static async Extract(
        inputFile: string,
        npmFile: string,
        target: string,
        formatter: (pa: PackageAnalytics) => object
    ): Promise<void> {
        const extractor = new Extractor(inputFile, npmFile);

        await extractor.extract();
        extractor.save(formatter, async (data, pa, i, max) => {
            const exists = fs.existsSync(target);
            const padding = `${i + 1}`.padStart(max.toString().length);

            if (!exists) fs.mkdirSync(target, { recursive: true });

            const fileName = `${pa.name}@${pa.version}.json`;

            console.log(`[${padding}/${max}] ${fileName}`);
            fs.writeFileSync(target, data, "utf8");
        });
    }

    constructor(private readonly _inputFile: string, private readonly _npmFile: string) {
        this._provider = new FlatFileProvider(this._npmFile);

        this._parseInputFile();
    }

    private _parseInputFile(): void {
        try {
            const content = fs.readFileSync(this._inputFile, "utf8");
            const modules: string[] = JSON.parse(content);

            if (!Array.isArray(modules)) throw new Error(`input data is not an array!`);

            this._versions = [];
            for (const module of modules) {
                this._versions.push(getNameAndVersion(module));
            }
        } catch (e) {
            console.log(e);
        }
    }

    async extract(): Promise<ReadonlyArray<PackageAnalytics>> {
        try {
            this._analytics = [];

            for (const [name, version] of this._versions) {
                console.log(`Fetching ${name}@${version ? version : `latest`}`);

                const resolver = new Resolver([name, version], this._provider, new OraLogger());
                const pa: PackageAnalytics = await resolver.resolve();

                this._analytics.push(pa);
            }

            return this._analytics;
        } catch (e) {
            throw e;
        }
    }

    /* istanbul ignore next */
    async save<T extends object = object>(
        formatter: (pa: PackageAnalytics) => T,
        saveCallback: (data: T, pa: PackageAnalytics, i: number, max: number) => Promise<void>
    ): Promise<void> {
        try {
            for (const [i, pa] of this._analytics.entries()) {
                const jsonData = formatter(pa);

                await saveCallback(jsonData, pa, i, this._analytics.length);
            }
        } catch (e) {
            throw new Error(`Couldn't save`);
        }
    }
}
