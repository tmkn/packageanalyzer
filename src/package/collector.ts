import { Package } from "./package";

interface ICollectorNode<T> {
    parent: ICollectorNode<T> | null;
    pkg: Package;
    data: T;
    children: ICollectorNode<T>[];
}

export interface ICollector<T> extends ICollectorNode<T> {
    flatten(): Map<Package, T>;
    flatten<Key>(keyFn: (node: ICollectorNode<T>) => Key): Map<Key, T>;
}

export class Collector<T> implements ICollector<T> {
    flatten(): Map<Package, T>;
    flatten<Key>(customKeyFn: (node: ICollectorNode<T>) => Key): Map<Key, T>;
    flatten<Key>(customKeyFn?: (node: ICollectorNode<T>) => Key): Map<Package, T> | Map<Key, T> {
        if (customKeyFn) {
            const visit = (parent: ICollectorNode<T>): void => {
                for (const node of parent.children) {
                    entries.set(customKeyFn(node), node.data);
                }
            };
            const entries: Map<Key, T> = new Map();

            entries.set(customKeyFn(this), this.data);
            visit(this);

            return entries;
        } else {
            const visit = (parent: ICollectorNode<T>): void => {
                for (const node of parent.children) {
                    entries.set(node.pkg, node.data);
                }
            };
            const entries: Map<Package, T> = new Map();

            entries.set(this.pkg, this.data);
            visit(this);

            return entries;
        }
    }
    parent: ICollectorNode<T> | null = null;
    children: ICollectorNode<T>[] = [];

    constructor(public data: T, public pkg: Package) {}
}
