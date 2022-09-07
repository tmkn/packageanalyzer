import * as path from "path";
import { promises as fs } from "fs";

import { Package } from "../package/package";
import { OnlinePackageProvider } from "../providers/online";
import { Visitor } from "../visitors/visitor";
import { OraLogger } from "../loggers/OraLogger";
import { DependencyUtilities } from "../extensions/utilities/DependencyUtilities";
import { IPackageMetadata, IPackageJson, isUnpublished, IUnpublishedPackageMetadata } from "../npm";
import { IPackageJsonProvider } from "../providers/provider";
import { Url } from "./requests";
import { EntryTypes, isPackageVersionArray } from "../reports/Report";

export class DependencyDumper {
    pkgs: Package[] = [];

    private _provider?: OnlinePackageProvider;

    async collect(pkg: EntryTypes, repoUrl: Url): Promise<void> {
        this._provider = new OnlinePackageProvider(repoUrl);

        if (isPackageVersionArray(pkg)) {
            for (const entry of pkg) {
                const visitor = new Visitor(entry, this._provider, new OraLogger());
                const pkg = await visitor.visit();
                this.pkgs.push(pkg);
            }
        } else {
            const visitor = new Visitor(pkg, this._provider, new OraLogger());
            const p = await visitor.visit();
            this.pkgs.push(p);
        }
    }

    async save(baseDir: string): Promise<void> {
        if (!this._provider) throw new Error(`pkg or provider is undefined`);

        const distinct: Set<string> = new Set();
        for (const pkg of this.pkgs) {
            const _distinct: Set<string> = new DependencyUtilities(pkg).withSelf.distinctNames;

            for (const name of _distinct) {
                distinct.add(name);
            }
        }

        const logger = new OraLogger();

        fs.mkdir(baseDir, { recursive: true });

        logger.start();

        try {
            for (const [i, dependency] of [...distinct].sort().entries()) {
                const data = await this._provider.getPackageMetadata(dependency);
                const folder = this._getFolder(baseDir, dependency);
                const fullPath = path.join(folder, `metadata.json`);

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
            const names: string = this.pkgs.map(pkg => pkg.fullName).join(`& `);
            logger.log(`Saved ${distinct.size} dependencies for ${names} at ${baseDir}`);
            logger.stop();
        }
    }

    private _getFolder(baseDir: string, pkgName: string): string {
        const parts = pkgName.split(`/`).filter(part => part !== ``);

        return path.join(baseDir, ...parts);
    }
}

export class DependencyDumperProvider implements IPackageJsonProvider {
    private _cache: Map<string, IPackageMetadata | IUnpublishedPackageMetadata> = new Map();
    private _initialized: Promise<void>;

    constructor(private _dir: string) {
        this._initialized = this._populateCache();
    }

    async getPackageInfo(
        name: string
    ): Promise<IPackageMetadata | IUnpublishedPackageMetadata | undefined> {
        await this._initialized;

        return this._cache.get(name);
    }

    async getPackageJson(name: string, version?: string): Promise<IPackageJson> {
        const data = await this.getPackageInfo(name);

        if (typeof data === "undefined") throw new Error(`No data found for package ${name}`);

        if (isUnpublished(data)) throw new Error(`Package ${name} was unpublished`);

        version = version ?? data["dist-tags"].latest;

        const versionData = data.versions[version];

        if (typeof versionData === "undefined")
            throw new Error(`No data found for version ${version} for package ${name}`);

        return versionData;
    }

    private async _populateCache(): Promise<void> {
        return new Promise(async (resolve, _reject) => {
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
