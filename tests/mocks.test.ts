import { DependencyUtilities } from "../src/extensions/utilities/DependencyUtilities";
import { createMockDependencyTree } from "./mocks";

describe(`Mock Tests`, () => {
    test(`Creates a package`, () => {
        const p = createMockDependencyTree({ name: `mockpackage`, version: `1.2.3` });

        expect(p.name).toBe(`mockpackage`);
        expect(p.version).toBe(`1.2.3`);
    });

    test(`Creates a package with custom data`, () => {
        const p = createMockDependencyTree({
            name: `mockpackage`,
            version: `1.2.3`,
            foo: { bar: `hello` }
        });

        expect(p.getData(`foo.bar`)).toBe(`hello`);
    });

    test(`Creates a package with dependencies`, () => {
        const p = createMockDependencyTree({
            name: `mockpackage`,
            version: `1.2.3`,
            dependencies: [
                {
                    name: `dep1`,
                    version: `9.9.9`,
                    dependencies: [
                        {
                            name: `dep2`,
                            version: `8.8.8`
                        }
                    ]
                }
            ]
        });

        const deps = new DependencyUtilities(p);

        expect(deps.withSelf.all.length).toBe(3);

        const dep1 = p.getPackageByName(`dep1`);
        const dep2 = p.getPackageByName(`dep2`);

        expect(dep1).toBeDefined();
        expect(dep2).toBeDefined();

        expect(dep1?.parent).toBe(p);
    });

    test(`Creates a package with devDependencies`, () => {
        const p = createMockDependencyTree(
            {
                name: `mockpackage`,
                version: `1.2.3`,
                devDependencies: [
                    {
                        name: `dep1`,
                        version: `9.9.9`,
                        devDependencies: [
                            {
                                name: `dep2`,
                                version: `8.8.8`
                            }
                        ]
                    }
                ]
            },
            "devDependencies"
        );

        const deps = new DependencyUtilities(p);

        expect(deps.withSelf.all.length).toBe(3);

        const dep1 = p.getPackageByName(`dep1`);
        const dep2 = p.getPackageByName(`dep2`);

        expect(dep1).toBeDefined();
        expect(dep2).toBeDefined();

        expect(dep1?.parent).toBe(p);
    });

    test(`Assigns default values for missing name or version`, () => {
        const p = createMockDependencyTree({});

        expect(p.name).toBe(`mockPackage`);
        expect(p.version).toBe(`1.2.3`);
    });

    test(`Throws on wrong "type"`, () => {
        //@ts-expect-error
        expect(() => createMockDependencyTree({}, "wrong_type")).toThrow();
    });
});
