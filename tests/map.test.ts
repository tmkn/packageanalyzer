import * as path from "path";

import { type IPackage } from "../src/package/package.js";
import { FileSystemPackageProvider } from "../src/providers/folder.js";
import { Visitor } from "../src/visitors/visitor.js";
import { OraLogger } from "../src/loggers/OraLogger.js";
import { map, type MappedDependency } from "../src/utils/map.js";
import { getPackageVersionFromPath } from "../src/visitors/util.node.js";

describe(`Map tests`, () => {
    let p: IPackage;
    let mapped: MappedDependency<{ foo: string }>;

    beforeAll(async () => {
        const rootPath = path.join("tests", "data", "testproject2");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageVersionFromPath(rootPath), provider, new OraLogger());

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
