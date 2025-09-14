import { type IPackage } from "../../../../shared/src/package/package.js";

export class PathUtilities {
    constructor(private readonly _p: IPackage) {}

    get path(): Array<[string, string]> {
        const path: Array<[string, string]> = [];
        let current: IPackage | null = this._p;

        while (current.parent !== null) {
            path.push([current.name, current.version]);

            current = current.parent;
        }

        path.push([current.name, current.version]);

        return path.reverse();
    }

    get pathString(): string {
        const levels: string[] = [];

        for (const [name, version] of this.path) {
            levels.push(`${name}@${version}`);
        }

        return levels.join(" → ");
    }
}
