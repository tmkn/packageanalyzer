import * as path from "path";

import * as assert from "assert";
import { FlatFolderProvider } from "../src/providers/flatFolder";
import { PackageVersion, INpmPackageVersion } from "../src/npm";

describe(`flatFolderProvider Tests`, () => {
    const destination = path.join("tests", "data", "flatfolder");
    let provider: FlatFolderProvider;

    before(() => {
        provider = new FlatFolderProvider(destination);
    });

    it(`Check size`, async () => {
        assert.equal(provider.size, -1);
    });

    it(`Resolves a package`, async () => {
        const pkg = await provider.getPackageByVersion(`typescript`);

        assert.equal(pkg.name, `typescript`);
    });

    it(`Resolves a package with version`, async () => {
        const pkg = await provider.getPackageByVersion(`typescript`, `3.5.1`);

        assert.equal(pkg.name, `typescript`);
        assert.equal(pkg.version, `3.5.1`);
    });

    it(`Resolves a package with semantic version syntax`, async () => {
        const pkg = await provider.getPackageByVersion(`typescript`, `^3.5.1`);

        assert.equal(pkg.name, `typescript`);
        assert.equal(pkg.version, `3.5.2`);
    });

    it(`Resolves multiple packages`, async () => {
        const names: PackageVersion[] = [["typescript", `3.5.2`], ["react"]];
        const pkgs: INpmPackageVersion[] = [];

        for await (const pkg of provider.getPackagesByVersion(names)) {
            pkgs.push(pkg);
        }

        assert.equal(pkgs.length, 2);
        assert.equal(pkgs[0].name, `typescript`);
        assert.equal(pkgs[1].name, `react`);
    });

    it(`Throws on not existant package`, () => {
        assert.rejects(
            () => provider.getPackageByVersion(`abdfoodoesn'texist`),
            Error,
            `Correctly threw an error`
        );
    });
});
