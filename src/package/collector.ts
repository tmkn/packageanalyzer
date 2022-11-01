import { Package } from "./package";

type PackageGroup = [Package, ...Package[]];

export type CollectorTuple<T> = [PackageGroup, T];

export type MinLength1Array<T> = [T, ...T[]];

export interface ICollectorNode<T> {
    pkg: Package;
    data: T;

    parent: ICollectorNode<T> | null;
    children: ICollectorNode<T>[];

    flatten(): MinLength1Array<CollectorTuple<T>>;
}

export class CollectorNode<T> implements ICollectorNode<T> {
    parent: ICollectorNode<T> | null = null;
    children: ICollectorNode<T>[] = [];

    constructor(public data: T, public pkg: Package) {}

    flatten(): MinLength1Array<CollectorTuple<T>> {
        const entries: MinLength1Array<CollectorTuple<T>> = [[[this.pkg], this.data]];
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
}
