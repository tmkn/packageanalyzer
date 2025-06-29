import { createMockPackage, type IMockPackageJson } from "./mocks.js";

describe(`Collector Tests`, () => {
    const mockData: IMockPackageJson = {
        name: `dep1`,
        version: `1.0.0`,
        dependencies: [
            {
                name: `dep2`,
                version: `1.0.0`,
                dependencies: [{ name: `duplicate`, version: `2.0.0` }]
            },
            {
                name: `dep3`,
                version: `1.0.0`,
                dependencies: [
                    {
                        name: `dep4`,
                        version: `1.0.0`,
                        dependencies: [{ name: `duplicate`, version: `2.0.0` }]
                    }
                ]
            },
            { name: `dep5`, version: `1.0.0` },
            { name: `dep6`, version: `2.0.0` }
        ]
    };

    const testPkg = createMockPackage(mockData);

    test(`correctly collects data`, () => {
        const c = testPkg.collect(pkg => ({ attr: pkg.fullName }));

        expect(c.data).toEqual({ attr: "dep1@1.0.0" });
        expect(c.children.length).toEqual(4);
        expect(c.children[0].data).toEqual({ attr: "dep2@1.0.0" });
        expect(c.children[3].data).toEqual({ attr: "dep6@2.0.0" });

        expect(c.item).toEqual(testPkg);
        expect(c.parent).toBeNull();
        expect(c.children[0].parent).toEqual(c);
    });

    test(`flattens correctly`, () => {
        const list = testPkg.collect(pkg => ({ attr: "hello" })).flatten();
        const duplicate = list.find(([[pkg]]) => pkg.fullName === "duplicate@2.0.0");

        expect(list.length).toEqual(7);

        expect(duplicate).toBeDefined();
        expect(duplicate![0].length).toEqual(2);
        expect(duplicate![1]).toEqual({ attr: "hello" });
    });
});
