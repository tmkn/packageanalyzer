import { Package } from "../../analyzers/package";

export class PathMetrics {
    constructor(private _p: Package) {}

    get path(): Array<[string, string]> {
        const path: Array<[string, string]> = [];
        let current: Package | null = this._p;

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
