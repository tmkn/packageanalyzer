"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.npmOnline = exports.OnlinePackageProvider = void 0;
const semver = require("semver");
const npm_1 = require("../npm");
const requests_1 = require("../utils/requests");
//loads npm data from the web
class OnlinePackageProvider {
    constructor(_url) {
        this._url = _url;
        this._cache = new Map();
    }
    async getPackageMetadata(name) {
        const cachedInfo = this._cache.get(name);
        if (typeof cachedInfo !== "undefined") {
            return cachedInfo;
        }
        else {
            const data = await (0, requests_1.downloadJson)(`${this._url}/${encodeURIComponent(name)}`);
            return data === null ? undefined : data;
        }
    }
    async *getPackageJsons(modules) {
        for (const [name, version] of modules) {
            yield this.getPackageJson(name, version);
        }
    }
    async getPackageJson(name, version = undefined) {
        let info = this._cache.get(name);
        if (!info) {
            info = await this.getPackageMetadata(name);
            if (!info) {
                const _version = typeof version !== "undefined" ? `@${version}` : ``;
                throw new Error(`Couldn't get package "${name}${_version}"`);
            }
            if ((0, npm_1.isUnpublished)(info)) {
                throw new Error(`Package "${name}" was unpublished`);
            }
            this._cache.set(name, info);
        }
        const allVersions = Object.keys(info.versions);
        const versionToResolve = typeof version !== "undefined" ? version : info["dist-tags"].latest;
        const resolvedVersion = semver.maxSatisfying(allVersions, versionToResolve);
        if (resolvedVersion === null) {
            throw new Error(`Couldn't resolve version ${version} for "${name}"`);
        }
        const packageJson = info.versions[resolvedVersion];
        if (!packageJson)
            throw new Error(`No package.json found for version ${resolvedVersion} for ${name}`);
        return packageJson;
    }
}
exports.OnlinePackageProvider = OnlinePackageProvider;
exports.npmOnline = new OnlinePackageProvider(`https://registry.npmjs.com`);
//# sourceMappingURL=online.js.map