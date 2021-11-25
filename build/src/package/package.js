"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Package = void 0;
const lodash_1 = require("lodash");
class Package {
    constructor(_data) {
        this._data = _data;
        this.parent = null;
        this.isLoop = false;
        this._decoratorData = new Map();
        this._dependencies = [];
    }
    get name() {
        return this._data.name;
    }
    get version() {
        return this._data.version;
    }
    get fullName() {
        return `${this.name}@${this.version}`;
    }
    get directDependencies() {
        return this._dependencies;
    }
    get deprecatedInfo() {
        const deprecated = this.getData("deprecated");
        if (typeof deprecated === "string") {
            return {
                deprecated: true,
                message: deprecated
            };
        }
        return {
            deprecated: false,
            message: ``
        };
    }
    addDependency(dependency) {
        dependency.parent = this;
        this._dependencies.push(dependency);
    }
    visit(callback, includeSelf = false) {
        if (includeSelf)
            callback(this);
        for (const child of this._dependencies) {
            callback(child);
            child.visit(callback, false);
        }
    }
    getPackagesBy(filter) {
        const matches = [];
        this.visit(d => {
            if (filter(d))
                matches.push(d);
        }, true);
        return matches;
    }
    getPackagesByName(name, version) {
        const matches = [];
        this.visit(d => {
            if (typeof version === "undefined") {
                if (d.name === name)
                    matches.push(d);
            }
            else {
                if (d.name === name && d.version === version)
                    matches.push(d);
            }
        }, true);
        return matches;
    }
    getPackageByName(name, version) {
        const matches = this.getPackagesByName(name, version);
        return matches[0] ?? null;
    }
    getData(key) {
        return (0, lodash_1.get)(this._data, key);
    }
    getDecoratorData(key) {
        const data = this._decoratorData.get(key);
        if (typeof data === "undefined") {
            throw new Error(`No extension data found for ${key.toString()}`);
        }
        return data;
    }
    setDecoratorData(key, data) {
        this._decoratorData.set(key, data);
    }
}
exports.Package = Package;
//# sourceMappingURL=package.js.map