import { IPackage } from "../src/package/package";
import { DiffUtilities } from "../src/extensions/utilities/DiffUtilities";
import { createMockPackage, IMockPackageJson } from "./mocks";

describe(`Diff Utilities Tests`, () => {
    const fromBaseData: IMockPackageJson = {
        name: `from`,
        version: `1.0.0`,
        dependencies: [
            { name: `oldDep1`, version: `1.0.0` },
            { name: `oldDep2`, version: `1.0.0` },
            { name: `updatedDep1`, version: `1.0.0` },
            { name: `updatedDep2`, version: `2.0.0` }
        ]
    };

    const toBaseData: IMockPackageJson = {
        name: `to`,
        version: `1.0.0`,
        dependencies: [
            { name: `newDep1`, version: `1.0.0` },
            { name: `newDep2`, version: `1.1.0` },
            { name: `updatedDep1`, version: `2.0.0` },
            { name: `updatedDep2`, version: `3.0.0` }
        ]
    };

    const toPkg: IPackage = createMockPackage(toBaseData);
    const fromPkg: IPackage = createMockPackage(fromBaseData);

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

    test(`Get new maintainer(s)`, () => {
        const fromPkg = createMockPackage({
            ...fromBaseData,
            ...{
                maintainers: [
                    { name: `maintainer1`, email: `maintainer1@test.mail` },
                    { name: `maintainer2`, email: `maintainer2@test.mail` }
                ]
            }
        });

        const toPkg = createMockPackage({
            ...toBaseData,
            ...{
                maintainers: [
                    { name: `maintainer1`, email: `maintainer1@test.mail` },
                    { name: `maintainer2`, email: `maintainer2@test.mail` },
                    { name: `newmaintainer1`, email: `newmaintainer1@test.mail` },
                    { name: `newmaintainer2`, email: `newmaintainer2@test.mail` }
                ]
            }
        });

        const { newMaintainers, isMaintainerTakeover } = new DiffUtilities(fromPkg, toPkg);
        const newMaintainer1 = newMaintainers?.find(user => user.name === `newmaintainer1`);
        const newMaintainer2 = newMaintainers?.find(user => user.name === `newmaintainer2`);

        expect(newMaintainers?.length).toBe(2);
        expect(newMaintainer1).toBeTruthy();
        expect(newMaintainer2).toBeTruthy();
        expect(isMaintainerTakeover).toBe(false);
    });

    test(`Returns undefined on missing maintainers`, () => {
        const { newMaintainers } = new DiffUtilities(fromPkg, toPkg);

        expect(newMaintainers).toBeUndefined();
    });

    test(`Identifies maintainer takeover`, () => {
        const fromPkg = createMockPackage({
            ...fromBaseData,
            ...{
                maintainers: [
                    { name: `maintainer1`, email: `maintainer1@test.mail` },
                    { name: `maintainer2`, email: `maintainer2@test.mail` }
                ]
            }
        });

        const toPkg = createMockPackage({
            ...toBaseData,
            ...{
                maintainers: [{ name: `takeoveruser`, email: `takeoveruser@test.mail` }]
            }
        });

        const { isMaintainerTakeover } = new DiffUtilities(fromPkg, toPkg);

        expect(isMaintainerTakeover).toBe(true);
    });

    test(`isMaintainerTakeover returns false on malformed user`, () => {
        // @ts-expect-error
        const toPkg = createMockPackage({
            ...toBaseData,
            ...{
                maintainers: [`malformed`]
            }
        });
        const fromPk = createMockPackage(fromBaseData);

        const { isMaintainerTakeover } = new DiffUtilities(fromPk, toPkg);

        expect(isMaintainerTakeover).toBe(false);
    });
});
