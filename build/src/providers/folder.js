"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemPackageProvider = void 0;
const path = require("path");
const fs = require("fs");
const semver = require("semver");
//gathers packages from a node_modules folder
class FileSystemPackageProvider {
    constructor(_folder) {
        this._paths = new Set();
        this._cache = new Map();
        const matches = this._findPackageJson(_folder);
        this._paths = new Set([...matches].sort());
        this._load();
    }
    _findPackageJson(folder) {
        try {
            const pkgs = [];
            const folderEntries = fs
                .readdirSync(folder, "utf8")
                .map(entry => path.join(folder, entry));
            for (const entry of folderEntries) {
                if (fs.statSync(entry).isDirectory()) {
                    pkgs.push(...this._findPackageJson(entry));
                }
                else if (entry.endsWith(`package.json`)) {
                    pkgs.push(entry);
                }
            }
            return pkgs;
        }
        catch (e) {
            console.log(e);
            return [];
        }
    }
    _load() {
        const failedPaths = [];
        for (const pkgPath of this._paths) {
            try {
                const content = fs.readFileSync(pkgPath, "utf8");
                const pkg = JSON.parse(content);
                this.addPackage(pkg);
            }
            catch (e) {
                failedPaths.push(pkgPath);
                continue;
            }
        }
        if (failedPaths.length > 0) {
            console.log(`Failed to load ${failedPaths.length} packages`);
        }
    }
    addPackage(pkg) {
        const { name, version } = pkg;
        const versions = this._cache.get(name);
        if (typeof versions === "undefined") {
            this._cache.set(name, new Map([[version, pkg]]));
        }
        else {
            const specificVersion = versions.get(version);
            if (typeof specificVersion === "undefined") {
                versions.set(version, pkg);
            }
        }
    }
    async *getPackageJsons(modules) {
        for (const pkgVersion of modules) {
            yield this.getPackageJson(...pkgVersion);
        }
    }
    async getPackageJson(name, version) {
        const versions = this._cache.get(name);
        let pkg;
        if (typeof versions === "undefined") {
            throw new Error(`Couldn't find package ${name}`);
        }
        //load latest available version
        if (typeof version === "undefined") {
            const [latestVersion] = [...versions.keys()].slice(-1);
            if (!latestVersion)
                throw new Error(`Couldn't get latest version for ${name}`);
            const specificVersion = versions.get(latestVersion);
            //should never happen..
            if (typeof specificVersion === "undefined")
                throw new Error(`Error extracting latest package ${name}@${version}`);
            pkg = specificVersion;
        }
        else {
            const availableVersions = [...versions.keys()];
            const resolvedVersion = semver.maxSatisfying(availableVersions, version);
            if (resolvedVersion === null) {
                throw new Error(`Couldn't resolve ${version} for ${name}`);
            }
            const specificVersion = versions.get(resolvedVersion);
            if (typeof specificVersion === "undefined")
                throw new Error(`Couldn't find package ${name}@${version}`);
            pkg = specificVersion;
        }
        return pkg;
    }
}
exports.FileSystemPackageProvider = FileSystemPackageProvider;
//# sourceMappingURL=folder.js.map