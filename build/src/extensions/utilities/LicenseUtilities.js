"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseUtilities = void 0;
class LicenseUtilities {
    constructor(_p) {
        this._p = _p;
    }
    get license() {
        try {
            const license = this._p.getData("license");
            const licenses = this._p.getData("licenses");
            //check if license field is set
            if (typeof license !== "undefined") {
                if (typeof license === "string") {
                    return license;
                }
                else if (this._isLicenseObject(license)) {
                    return license.type;
                }
                else {
                    return JSON.stringify(license);
                }
                //fallback to licenses field
            }
            else if (Array.isArray(licenses))
                return licenses.map(l => l.type).join(",");
            //weird format | not set -> fail
            else {
                throw new Error(`Unable to parse license`);
            }
        }
        catch {
            return `PARSE ERROR: ${this._p.fullName}`;
        }
    }
    //even though license should be string some packages contain json objects...
    _isLicenseObject(data) {
        if (typeof data === "object" && data !== null) {
            return "type" in data && "url" in data;
        }
        return false;
    }
    get licenses() {
        const licenseMap = new Map();
        this._p.visit(d => {
            const packageKey = licenseMap.get(d.name);
            const license = new LicenseUtilities(d).license;
            if (!packageKey) {
                licenseMap.set(d.name, new Map([[d.version, license]]));
            }
            else {
                packageKey.set(d.version, license);
            }
        }, true);
        return licenseMap;
    }
    get licensesByGroup() {
        const licenses = this.licenses;
        const sorted = new Map();
        const grouped = [];
        for (const [name, versions] of licenses) {
            for (const license of versions.values()) {
                const entry = sorted.get(license);
                if (entry) {
                    entry.add(name);
                }
                else {
                    sorted.set(license, new Set([name]));
                }
            }
        }
        for (const [license, names] of sorted) {
            grouped.push({
                license: license,
                names: [...new Set([...names.values()].sort())]
            });
        }
        return grouped.sort((a, b) => b.names.length - a.names.length);
    }
}
exports.LicenseUtilities = LicenseUtilities;
//# sourceMappingURL=LicenseUtilities.js.map