import * as path from "path";

import { Package } from "../src/package/package";
import { FileSystemPackageProvider } from "../src/providers/folder";
import { getPackageJson, Visitor } from "../src/visitors/visitor";
import { OraLogger } from "../src/utils/logger";
import { map, MappedDependency } from "../src/utils/map";

describe(`Map tests`, () => {
    let p: Package;
    let mapped: MappedDependency<{ foo: string }>;

    beforeAll(async () => {
        const rootPath = path.join("tests", "data", "testproject2");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageJson(rootPath), provider, new OraLogger());

        p = await visitor.visit();
        mapped = map<{ foo: string }>(p, p => ({ foo: p.fullName }));
    });

    test(`Correctly maps Package`, () => {
        expect(p.fullName).toEqual(mapped.foo);
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
