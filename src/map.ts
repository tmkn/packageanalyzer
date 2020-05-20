import { PackageAnalytics } from "./analyzers/package";
import { Visitor } from "./visitors/visitor";
import { getNameAndVersion } from "./npm";
import { npmOnline } from "./providers/online";
import { OraLogger } from "./logger";

interface IMappedDependency<T> {
    parent: T | null;
    dependencies: IMappedDependency<T>[];
}

export type MapFn<T> = (pa: PackageAnalytics) => T;
export type MappedDependency<T> = T & IMappedDependency<T>;

export function map<T>(pa: PackageAnalytics, mapFn: MapFn<T>): MappedDependency<T> {
    const mappedDependency: MappedDependency<T> = {
        ...mapFn(pa),
        parent: null,
        dependencies: []
    };

    mappedDependency.dependencies = pa.directDependencies.map(childPa => {
        const child: MappedDependency<T> = map<T>(childPa, mapFn);

        //child.parent = mappedDependency;

        return child;
    });

    return mappedDependency;
}

(async () => {
    const visitor = new Visitor(getNameAndVersion(`react`), npmOnline, new OraLogger());
    const pa = await visitor.visit();

    const mapped = map(pa, pa => 3);

    console.log(JSON.stringify(mapped, null, 4));
})();
