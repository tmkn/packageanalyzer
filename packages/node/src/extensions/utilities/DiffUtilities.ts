import { type INpmUser } from "../../../../shared/src/npm.js";
import { type IPackage } from "../../../../shared/src/package/package.js";

export type UpdateTuple = [from: IPackage, to: IPackage];

export class DiffUtilities {
    constructor(
        private readonly _fromPkg: IPackage,
        private readonly _toPkg: IPackage
    ) {}

    get newMaintainers(): INpmUser[] | undefined {
        try {
            const fromMaintainers = this._fromPkg.getData(`maintainers`);
            const toMaintainers = this._toPkg.getData(`maintainers`);

            if (isNpmUserArray(fromMaintainers) && isNpmUserArray(toMaintainers)) {
                const newMaintainers: INpmUser[] = [];

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

    get newPackages(): IPackage[] {
        const newPackages: IPackage[] = [];

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

    get removedPackages(): IPackage[] {
        const removedPackages: IPackage[] = [];

        for (const from of this._fromPkg.directDependencies) {
            const stillExists = this._toPkg.directDependencies.find(to => to.name === from.name);

            if (!stillExists) removedPackages.push(from);
        }

        return removedPackages;
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
