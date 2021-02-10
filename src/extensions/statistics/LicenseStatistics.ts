import { Package } from "../../analyzers/package";

type Name = string;
type Version = string;
type License = string;

export type LicenseSummary = Map<Name, Map<Version, License>>;
export type GroupedLicenseSummary = Array<{ license: string; names: string[] }>;

export class LicenseStatistics {
    constructor(private _p: Package) {}

    get licenses(): LicenseSummary {
        const licenseMap: LicenseSummary = new Map();

        this._p.visit(d => {
            const packageKey = licenseMap.get(d.name);

            if (!packageKey) {
                licenseMap.set(d.name, new Map([[d.version, d.license]]));
            } else {
                packageKey.set(d.version, d.license);
            }
        }, true);

        return licenseMap;
    }

    get licensesByGroup(): GroupedLicenseSummary {
        const licenses = this.licenses;
        const sorted: Map<string, Set<string>> = new Map();
        const grouped: GroupedLicenseSummary = [];

        for (const [name, versions] of licenses) {
            for (const license of versions.values()) {
                const entry = sorted.get(license);

                if (entry) {
                    entry.add(name);
                } else {
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
