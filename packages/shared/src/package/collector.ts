type ItemGroup<I> = [I, ...I[]];

export type CollectorTuple<D, I> = [ItemGroup<I>, D];

export type MinLength1Array<T> = [T, ...T[]];

export interface ICollectorNode<T, I> {
    item: I;
    data: T;

    parent: ICollectorNode<T, I> | null;
    children: ICollectorNode<T, I>[];

    flatten(): MinLength1Array<CollectorTuple<T, I>>;
}

export class CollectorNode<D, I> implements ICollectorNode<D, I> {
    parent: ICollectorNode<D, I> | null = null;
    children: ICollectorNode<D, I>[] = [];

    constructor(
        public data: D,
        public item: I,
        private readonly _identity: (item: I) => string
    ) {}

    flatten(): MinLength1Array<CollectorTuple<D, I>> {
        const entries: MinLength1Array<CollectorTuple<D, I>> = [[[this.item], this.data]];
        const queue: ICollectorNode<D, I>[] = [...this.children];

        while (queue.length > 0) {
            const node = queue.shift()!;
            // not the best runtime performance but it will do for now
            const existingGroup = entries.find(
                ([[existingPkg]]) => this._identity(existingPkg) === this._identity(node.item)
            );

            if (existingGroup) {
                existingGroup[0].push(node.item);
            } else {
                entries.push([[node.item], node.data]);
            }

            if (node.children.length > 0) {
                queue.push(...node.children);
            }
        }

        return entries;
    }
}
