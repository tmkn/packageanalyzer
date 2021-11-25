import { Package } from "../package/package";
interface IMappedDependency<T> {
    parent: T | null;
    dependencies: IMappedDependency<T>[];
}
export declare type MapFn<T> = (p: Package) => T;
export declare type MappedDependency<T> = T & IMappedDependency<T>;
export declare function map<T>(p: Package, mapFn: MapFn<T>): MappedDependency<T>;
export {};
//# sourceMappingURL=map.d.ts.map