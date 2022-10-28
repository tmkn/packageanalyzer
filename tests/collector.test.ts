import { Package } from "../src/package/package";
import { createMockPackage, IMockPackageJson } from "./mocks";

describe(`Collector Tests`, () => {
    const mockData: IMockPackageJson = {
        name: `from`,
        version: `1.0.0`,
        dependencies: [
            { name: `oldDep1`, version: `1.0.0` },
            {
                name: `oldDep2`,
                version: `1.0.0`,
                dependencies: [{ name: `oldDep3`, version: `1.0.0` }]
            },
            { name: `updatedDep1`, version: `1.0.0` },
            { name: `updatedDep2`, version: `2.0.0` }
        ]
    };

    const testPkg: Package = createMockPackage(mockData);

    test(`correctly collects data`, () => {
        const c = testPkg.collect(pkg => ({ attr: pkg.fullName }));

        expect(c.data).toEqual({ attr: "from@1.0.0" });
        expect(c.children.length).toEqual(4);
        expect(c.children[0].data).toEqual({ attr: "oldDep1@1.0.0" });
        expect(c.children[3].data).toEqual({ attr: "updatedDep2@2.0.0" });

        expect(c.pkg).toEqual(testPkg);
        expect(c.parent).toBeNull();
        expect(c.children[0].parent).toEqual(c);
    });

    test(`flattens correctly with no key arg`, () => {
        const list = testPkg.collect(pkg => ({ attr: "hello" })).flatten();

        expect(list.size).toEqual(5);

        for (const [pkg, data] of list) {
            expect(data).toEqual({ attr: "hello" });
            expect(Object.keys(pkg)).toEqual(Object.keys(testPkg));
        }
    });

    test(`flattens correctly with key arg`, () => {
        const list = testPkg.collect(pkg => ({ attr: "hello" })).flatten(node => node.pkg.fullName);

        expect(list.size).toEqual(5);

        for (const [key, data] of list) {
            expect(data).toEqual({ attr: "hello" });
            expect(typeof key === "string").toBeTruthy();
        }
    });
});
