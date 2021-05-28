import * as path from "path";
import { promises as fs } from "fs";

import { Package } from "../package/package";
import { OnlinePackageProvider } from "../providers/online";
import { PackageVersion, Visitor } from "../visitors/visitor";
import { OraLogger } from "./logger";
import { DependencyMetrics } from "../extensions/metrics/DependencyMetrics";
import { IPackageVersionProvider } from "../providers/folder";
import { INpmPackage, INpmPackageVersion, isUnpublished, IUnpublishedNpmPackage } from "../npm";

export class DependencyDumper {
    pkg?: Package;

    private _provider?: OnlinePackageProvider;

    async collect(pkg: PackageVersion, repoUrl: string): Promise<void> {
        this._provider = new OnlinePackageProvider(repoUrl);

        const visitor = new Visitor(pkg, this._provider, new OraLogger());
        this.pkg = await visitor.visit();
    }

    async save(baseDir: string): Promise<void> {
        if (!this.pkg || !this._provider) throw new Error(`pkg or provider is undefined`);

        const distinct: Set<string> = new DependencyMetrics(this.pkg).withSelf.distinctNames;
        const logger = new OraLogger();

        fs.mkdir(baseDir, { recursive: true });

        logger.start();

        try {
            for (const [i, dependency] of [...distinct].sort().entries()) {
                const data = await this._provider.getPackageInfo(dependency);
                const folder = this._getFolder(baseDir, dependency);
                const fullPath = path.join(folder, `package.json`);

                if (typeof data === "undefined") {
                    throw new Error(`Data for ${dependency} was undefined`);
                }

                await fs.mkdir(folder, { recursive: true });
                await fs.writeFile(fullPath, JSON.stringify(data));

                const digits = distinct.size.toString().length;
                const prefix: string = `${i + 1}`.padStart(digits);
                logger.log(`[${prefix}/${distinct.size}]: ${fullPath}`);
            }
        } finally {
            logger.log(
                `Saved ${distinct.size} dependencies for ${this.pkg.fullName} at ${baseDir}`
            );
            logger.stop();
        }
    }

    private _getFolder(baseDir: string, pkgName: string): string {
        const parts = pkgName.split(`/`).filter(part => part !== ``);

        return path.join(baseDir, ...parts);
    }
}

export class DependencyDumperProvider implements IPackageVersionProvider {
    private _cache: Map<string, INpmPackage | IUnpublishedNpmPackage> = new Map();
    private _initialized: Promise<void>;

    get size(): number {
        return this._cache.size;
    }

    constructor(private _dir: string) {
        this._initialized = this._populateCache();
    }

    async getPackageInfo(name: string): Promise<INpmPackage | IUnpublishedNpmPackage | undefined> {
        await this._initialized;

        return this._cache.get(name);
    }

    async getPackageByVersion(name: string, version?: string): Promise<INpmPackageVersion> {
        const data = await this.getPackageInfo(name);

        if (typeof data === "undefined") throw new Error(`No data found for package ${name}`);

        if (isUnpublished(data)) throw new Error(`Package ${name} was unpublished`);

        version = version ?? data["dist-tags"].latest;

        const versionData = data.versions[version];

        if (typeof versionData === "undefined")
            throw new Error(`No data found for version ${version} for package ${name}`);

        return versionData;
    }
    async *getPackagesByVersion(
        modules: PackageVersion[]
    ): AsyncIterableIterator<INpmPackageVersion> {
        for (const [name, version] of modules) {
            yield this.getPackageByVersion(name, version);
        }
    }

    private async _populateCache(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const filePaths = await this._readDir(this._dir);

                for (const filePath of filePaths) {
                    try {
                        const file: string = (await fs.readFile(filePath)).toString();
                        const json = JSON.parse(file);

                        if (json.name) {
                            this._cache.set(json.name, json);
                        }
                    } catch {}
                }
            } finally {
                resolve();
            }
        });
    }

    private async _readDir(dir: string): Promise<string[]> {
        let files: string[] = [];

        const folderContent = await fs.readdir(dir, { withFileTypes: true });

        for (const file of folderContent) {
            if (file.isDirectory()) {
                files = [...files, ...(await this._readDir(path.join(dir, file.name)))];
            } else if (file.isFile()) {
                files.push(path.join(dir, file.name));
            }
        }

        return files.filter(file => file.endsWith(`.json`));
    }
}
