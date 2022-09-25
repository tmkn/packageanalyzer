import { Package } from "../src";
import { DiffUtilities } from "../src/extensions/utilities/DiffUtilities";
import { createMockPackage } from "./mocks";

describe(`Diff Utilities Tests`, () => {
    const fromPkg: Package = createMockPackage({
        name: `from`,
        version: `1.0.0`,
        dependencies: [
            { name: `oldDep1`, version: `1.0.0` },
            { name: `oldDep2`, version: `1.0.0` },
            { name: `updatedDep1`, version: `1.0.0` },
            { name: `updatedDep2`, version: `2.0.0` }
        ]
    });
    const toPkg: Package = createMockPackage({
        name: `to`,
        version: `1.0.0`,
        dependencies: [
            { name: `newDep1`, version: `1.0.0` },
            { name: `newDep2`, version: `1.1.0` },
            { name: `updatedDep1`, version: `2.0.0` },
            { name: `updatedDep2`, version: `3.0.0` }
        ]
    });

    test(`Get new packages`, () => {
        const { newPackages } = new DiffUtilities(fromPkg, toPkg);
        const newDep1 = newPackages.find(pkg => pkg.fullName === `newDep1@1.0.0`);
        const newDep2 = newPackages.find(pkg => pkg.fullName === `newDep2@1.1.0`);

        expect.assertions(3);

        expect(newPackages.length).toEqual(2);
        expect(newDep1).toBeTruthy();
        expect(newDep2).toBeTruthy();
    });

    test(`Get removed packages`, () => {
        const { removedPackages } = new DiffUtilities(fromPkg, toPkg);
        const removedDep1 = removedPackages.find(pkg => pkg.fullName === `oldDep1@1.0.0`);
        const removedDep2 = removedPackages.find(pkg => pkg.fullName === `oldDep2@1.0.0`);

        expect.assertions(3);

        expect(removedPackages.length).toEqual(2);
        expect(removedDep1).toBeTruthy();
        expect(removedDep2).toBeTruthy();
    });

    test(`Get updated packages`, () => {
        const { updatedPackages } = new DiffUtilities(fromPkg, toPkg);
        const updateDep1 = updatedPackages.find(
            ([from, to]) =>
                from.fullName === `updatedDep1@1.0.0` && to.fullName === `updatedDep1@2.0.0`
        );
        const updateDep2 = updatedPackages.find(
            ([from, to]) =>
                from.fullName === `updatedDep2@2.0.0` && to.fullName === `updatedDep2@3.0.0`
        );

        expect(updatedPackages.length).toEqual(2);
        expect(updateDep1).toBeTruthy();
        expect(updateDep2).toBeTruthy();
    });
});
