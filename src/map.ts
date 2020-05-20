import { PackageAnalytics } from "./analyzers/package";

interface IMappedDependency<T> {
    parent: T | null;
    dependencies: IMappedDependency<T>[];
}

export type MapFn<T> = (pa: PackageAnalytics) => T;
export type MappedDependency<T> = T & IMappedDependency<T>;

//useful maybe later? ¯\_(ツ)_/¯
//maps PackageAnalytics to another format
export function map<T>(pa: PackageAnalytics, mapFn: MapFn<T>): MappedDependency<T> {
    const mappedDependency: MappedDependency<T> = {
        ...mapFn(pa),
        parent: null,
        dependencies: []
    };

    mappedDependency.dependencies = pa.directDependencies.map(childPa => {
        const child: MappedDependency<T> = map<T>(childPa, mapFn);

        child.parent = mappedDependency;

        return child;
    });

    return mappedDependency;
}
