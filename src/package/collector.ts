import { Package } from "./package";

type PackageGroup = [Package, ...Package[]];

export type CollectorTuple<T> = [Package, T];
export type CollectorTupleGrouped<T> = [PackageGroup, T];

export type MinLength1Array<T> = [T, ...T[]];

export interface ICollectorNode<T> {
    pkg: Package;
    data: T;

    parent: ICollectorNode<T> | null;
    children: ICollectorNode<T>[];

    flatten(): MinLength1Array<CollectorTuple<T>>;
    flatten(grouped: true): MinLength1Array<CollectorTupleGrouped<T>>;
    flatten(grouped: false): MinLength1Array<CollectorTuple<T>>;
    flatten(
        grouped?: boolean
    ): MinLength1Array<CollectorTuple<T>> | MinLength1Array<CollectorTupleGrouped<T>>;
}

export class CollectorNode<T> implements ICollectorNode<T> {
    parent: ICollectorNode<T> | null = null;
    children: ICollectorNode<T>[] = [];

    constructor(public data: T, public pkg: Package) {}
    flatten(): MinLength1Array<CollectorTuple<T>>;
    flatten(grouped: true): MinLength1Array<CollectorTupleGrouped<T>>;
    flatten(grouped: false): MinLength1Array<CollectorTuple<T>>;
    flatten(
        grouped: boolean = false
    ): MinLength1Array<CollectorTuple<T>> | MinLength1Array<CollectorTupleGrouped<T>> {
        return grouped ? this._flattenGrouped() : this._flatten();
    }

    private _flattenGrouped(): MinLength1Array<CollectorTupleGrouped<T>> {
        const entries: MinLength1Array<CollectorTupleGrouped<T>> = [[[this.pkg], this.data]];
        const queue: ICollectorNode<T>[] = [...this.children];

        while (queue.length > 0) {
            const node = queue.shift()!;
            // not the best runtime performance but it will do for now
            const existingGroup = entries.find(
                ([[existingPkg]]) => existingPkg.fullName === node.pkg.fullName
            );

            if (existingGroup) {
                existingGroup[0].push(node.pkg);
            } else {
                entries.push([[node.pkg], node.data]);
            }

            if (node.children.length > 0) {
                queue.push(...node.children);
            }
        }

        return entries;
    }

    private _flatten(): MinLength1Array<CollectorTuple<T>> {
        const entries: MinLength1Array<CollectorTuple<T>> = [[this.pkg, this.data]];
        const queue: ICollectorNode<T>[] = [...this.children];

        while (queue.length > 0) {
            const node = queue.shift()!;
            entries.push([node.pkg, node.data]);

            if (node.children.length > 0) queue.push(...node.children);
        }

        return entries;
    }
}
