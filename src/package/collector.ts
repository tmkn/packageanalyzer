import { Package } from "./package";

type PackageGroup = [Package, ...Package[]];

// interface ICollectorNode<T> {
//     pkg: Package;
//     data: T;
// }

// interface ICollectorNodeGrouped<T> {
//     pkg: PackageGroup;
//     data: T;
// }

export type CollectorTuple<T> = [Package, T];
export type CollectorTupleGrouped<T> = [PackageGroup, T];

interface ICollectorTreeNode<T> {
    pkg: Package;
    data: T;

    parent: ICollectorTreeNode<T> | null;
    children: ICollectorTreeNode<T>[];
}

export interface ICollector<T> extends ICollectorTreeNode<T> {
    flatten(): CollectorTuple<T>[];
    flatten(grouped: true): CollectorTupleGrouped<T>[];
    flatten(grouped: false): CollectorTuple<T>[];
    flatten(grouped?: boolean): CollectorTuple<T>[] | CollectorTupleGrouped<T>[];
}

export class Collector<T> implements ICollector<T> {
    parent: ICollectorTreeNode<T> | null = null;
    children: ICollectorTreeNode<T>[] = [];

    constructor(public data: T, public pkg: Package) {}
    flatten(): CollectorTuple<T>[];
    flatten(grouped: true): CollectorTupleGrouped<T>[];
    flatten(grouped: false): CollectorTuple<T>[];
    flatten(grouped: boolean = false): CollectorTuple<T>[] | CollectorTupleGrouped<T>[] {
        if (grouped) {
            const queue: ICollectorTreeNode<T>[] = [this];
            const entries: CollectorTupleGrouped<T>[] = [];

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
        } else {
            const queue: ICollectorTreeNode<T>[] = [this];
            const entries: CollectorTuple<T>[] = [];

            while (queue.length > 0) {
                const node = queue.shift()!;
                entries.push([node.pkg, node.data]);

                if (node.children.length > 0) queue.push(...node.children);
            }

            return entries;
        }
    }
}
