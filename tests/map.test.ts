import * as path from "path";

import { PackageAnalytics } from "../src/analyzers/package";
import { getPackageJson } from "../src/visitors/folder";
import { IPackageVersionProvider, FileSystemPackageProvider } from "../src/providers/folder";
import { INpmPackageVersion } from "../src/npm";
import { Visitor } from "../src/visitors/visitor";
import { OraLogger } from "../src/logger";
import { map, MappedDependency } from "../src/map";

describe(`Map tests`, () => {
    let pa: PackageAnalytics;
    let mapped: MappedDependency<{ foo: string }>;

    beforeAll(async () => {
        const rootPath = path.join("tests", "data", "testproject2");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageJson(rootPath), provider, new OraLogger());

        pa = await visitor.visit();
        mapped = map<{ foo: string }>(pa, pa => ({ foo: pa.fullName }));
    });

    test(`Correctly maps PackageAnalytics`, () => {
        expect(pa.fullName).toEqual(mapped.foo);
    });

    test(`Correctly sets dependencis`, () => {
        expect(mapped.dependencies.length).toEqual(1);
    });

    test(`Correctly sets parent`, () => {
        const checkParent = (
            current: MappedDependency<unknown>,
            parent: MappedDependency<unknown> | null
        ) => {
            expect(current.parent === parent).toEqual(true);

            for (const child of current.dependencies) {
                checkParent(child, current);
            }
        };

        checkParent(mapped, null);
    });
});
