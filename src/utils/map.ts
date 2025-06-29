import { type IPackage } from "../package/package.js";

interface IMappedDependency<T> {
    parent: T | null;
    dependencies: IMappedDependency<T>[];
}

export type MapFn<T> = (p: IPackage) => T;
export type MappedDependency<T> = T & IMappedDependency<T>;

//useful maybe later? ¯\_(ツ)_/¯
//maps Package to another format
export function map<T>(p: IPackage, mapFn: MapFn<T>): MappedDependency<T> {
    const mappedDependency: MappedDependency<T> = {
        ...mapFn(p),
        parent: null,
        dependencies: []
    };

    mappedDependency.dependencies = p.directDependencies.map(childPa => {
        const child: MappedDependency<T> = map<T>(childPa, mapFn);

        child.parent = mappedDependency;

        return child;
    });

    return mappedDependency;
}
