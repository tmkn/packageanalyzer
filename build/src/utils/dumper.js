"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyDumperProvider = exports.DependencyDumper = void 0;
const path = require("path");
const fs_1 = require("fs");
const online_1 = require("../providers/online");
const visitor_1 = require("../visitors/visitor");
const logger_1 = require("./logger");
const DependencyUtilities_1 = require("../extensions/utilities/DependencyUtilities");
const npm_1 = require("../npm");
class DependencyDumper {
    async collect(pkg, repoUrl) {
        this._provider = new online_1.OnlinePackageProvider(repoUrl);
        const visitor = new visitor_1.Visitor(pkg, this._provider, new logger_1.OraLogger());
        this.pkg = await visitor.visit();
    }
    async save(baseDir) {
        if (!this.pkg || !this._provider)
            throw new Error(`pkg or provider is undefined`);
        const distinct = new DependencyUtilities_1.DependencyUtilities(this.pkg).withSelf.distinctNames;
        const logger = new logger_1.OraLogger();
        fs_1.promises.mkdir(baseDir, { recursive: true });
        logger.start();
        try {
            for (const [i, dependency] of [...distinct].sort().entries()) {
                const data = await this._provider.getPackageMetadata(dependency);
                const folder = this._getFolder(baseDir, dependency);
                const fullPath = path.join(folder, `package.json`);
                if (typeof data === "undefined") {
                    throw new Error(`Data for ${dependency} was undefined`);
                }
                await fs_1.promises.mkdir(folder, { recursive: true });
                await fs_1.promises.writeFile(fullPath, JSON.stringify(data));
                const digits = distinct.size.toString().length;
                const prefix = `${i + 1}`.padStart(digits);
                logger.log(`[${prefix}/${distinct.size}]: ${fullPath}`);
            }
        }
        finally {
            logger.log(`Saved ${distinct.size} dependencies for ${this.pkg.fullName} at ${baseDir}`);
            logger.stop();
        }
    }
    _getFolder(baseDir, pkgName) {
        const parts = pkgName.split(`/`).filter(part => part !== ``);
        return path.join(baseDir, ...parts);
    }
}
exports.DependencyDumper = DependencyDumper;
class DependencyDumperProvider {
    constructor(_dir) {
        this._dir = _dir;
        this._cache = new Map();
        this._initialized = this._populateCache();
    }
    async getPackageInfo(name) {
        await this._initialized;
        return this._cache.get(name);
    }
    async getPackageJson(name, version) {
        const data = await this.getPackageInfo(name);
        if (typeof data === "undefined")
            throw new Error(`No data found for package ${name}`);
        if ((0, npm_1.isUnpublished)(data))
            throw new Error(`Package ${name} was unpublished`);
        version = version ?? data["dist-tags"].latest;
        const versionData = data.versions[version];
        if (typeof versionData === "undefined")
            throw new Error(`No data found for version ${version} for package ${name}`);
        return versionData;
    }
    async *getPackageJsons(modules) {
        for (const [name, version] of modules) {
            yield this.getPackageJson(name, version);
        }
    }
    async _populateCache() {
        return new Promise(async (resolve, reject) => {
            try {
                const filePaths = await this._readDir(this._dir);
                for (const filePath of filePaths) {
                    try {
                        const file = (await fs_1.promises.readFile(filePath)).toString();
                        const json = JSON.parse(file);
                        if (json.name) {
                            this._cache.set(json.name, json);
                        }
                    }
                    catch { }
                }
            }
            finally {
                resolve();
            }
        });
    }
    async _readDir(dir) {
        let files = [];
        const folderContent = await fs_1.promises.readdir(dir, { withFileTypes: true });
        for (const file of folderContent) {
            if (file.isDirectory()) {
                files = [...files, ...(await this._readDir(path.join(dir, file.name)))];
            }
            else if (file.isFile()) {
                files.push(path.join(dir, file.name));
            }
        }
        return files.filter(file => file.endsWith(`.json`));
    }
}
exports.DependencyDumperProvider = DependencyDumperProvider;
//# sourceMappingURL=dumper.js.map