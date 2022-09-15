import { INpmUser } from "../../npm";
import { Package } from "../../package/package";

type UpdateTuple = [from: Package, to: Package];

export class DiffUtilities {
    constructor(private _fromPkg: Package, private _toPkg: Package) {}

    get newMaintainers(): INpmUser[] | undefined {
        try {
            const fromMaintainers = this._fromPkg.getData(`maintainers`);
            const toMaintainers = this._toPkg.getData(`maintainers`);

            if (isNpmUserArray(fromMaintainers) && isNpmUserArray(toMaintainers)) {
                let newMaintainers: INpmUser[] = [];

                for (const maintainer of toMaintainers) {
                    const isAlreadyMaintainer = fromMaintainers.find(
                        ({ name: existinMaintainerName }) =>
                            maintainer.name === existinMaintainerName
                    );

                    if (!isAlreadyMaintainer) newMaintainers.push(maintainer);
                }

                return newMaintainers;
            }

            throw new Error(`No maintainers found`);
        } catch {
            return undefined;
        }
    }

    // returns true if all maintainers are new, might indicate a malicious takeover
    get isMaintainerTakeover(): boolean {
        const toMaintainers = this._toPkg.getData(`maintainers`);

        if (isNpmUserArray(toMaintainers)) {
            return toMaintainers.length === this.newMaintainers?.length;
        }

        return false;
    }

    get newPackages(): Package[] {
        const newPackages: Package[] = [];

        for (const dep of this._toPkg.directDependencies) {
            const exists = this._fromPkg.directDependencies.find(
                oldPkg => oldPkg.name === dep.name
            );

            if (!exists) newPackages.push(dep);
        }

        return newPackages;
    }

    get updatedPackages(): UpdateTuple[] {
        const updatedPackages: UpdateTuple[] = [];

        for (const to of this._toPkg.directDependencies) {
            const updatedFrom = this._fromPkg.directDependencies.find(
                from => from.name === to.name && from.version !== to.version // don't want to include packages that didn't change in version
            );

            if (updatedFrom) {
                updatedPackages.push([updatedFrom, to]);
            }
        }

        return updatedPackages;
    }

    get removedPackages(): Package[] {
        throw new Error(`Not implemented`);
    }
}

function isNpmUser(user: unknown): user is INpmUser {
    if (user && typeof user === "object") {
        if ("name" in user && "email" in user) {
            return true;
        }
    }

    return false;
}

function isNpmUserArray(array: unknown): array is INpmUser[] {
    if (Array.isArray(array)) {
        return array.every(entry => isNpmUser(entry));
    }

    return false;
}
