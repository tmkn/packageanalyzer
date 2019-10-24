import * as path from "path";

import { FlatFolderProvider } from "../src/providers/flatFolder";
import { PackageVersion, INpmPackageVersion } from "../src/npm";

describe(`flatFolderProvider Tests`, () => {
    const destination = path.join("tests", "data", "flatfolder");
    let provider: FlatFolderProvider;

    beforeAll(() => {
        provider = new FlatFolderProvider(destination);
    });

    test(`Check size`, async () => {
        expect(provider.size).toBe(-1);
    });

    test(`Resolves a package`, async () => {
        const pkg = await provider.getPackageByVersion(`typescript`);

        expect(pkg.name).toBe(`typescript`);
    });

    test(`Resolves a package with version`, async () => {
        const pkg = await provider.getPackageByVersion(`typescript`, `3.5.1`);

        expect(pkg.name).toBe(`typescript`);
        expect(pkg.version).toBe(`3.5.1`);
    });

    test(`Resolves a package with semantic version syntax`, async () => {
        const pkg = await provider.getPackageByVersion(`typescript`, `^3.5.1`);

        expect(pkg.name).toBe(`typescript`);
        expect(pkg.version).toBe(`3.5.2`);
    });

    test(`Resolves multiple packages`, async () => {
        const names: PackageVersion[] = [["typescript", `3.5.2`], ["react"]];
        const pkgs: INpmPackageVersion[] = [];

        for await (const pkg of provider.getPackagesByVersion(names)) {
            pkgs.push(pkg);
        }

        expect(pkgs.length).toBe(2);
        expect(pkgs[0].name).toBe(`typescript`);
        expect(pkgs[1].name).toBe(`react`);
    });

    test(`Throws on not existant package`, async () => {
        expect.assertions(1);

        try {
            await provider.getPackageByVersion(`abdfoodoesn'texist`);
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
});
