import * as path from "path";

import * as assert from "assert";
import { FlatFolderProvider } from "../src/providers/flatFolder";
import { PackageVersion } from "../src/npm";

describe(`flatFolderProvider Tests`, () => {
    const destination = path.join("tests", "data", "flatfolder");
    let provider: FlatFolderProvider;

    before(() => {
        provider = new FlatFolderProvider(destination);
    });

    it(`Resolves a package`, async () => {
        let pkg = await provider.getPackageByVersion(`typescript`);

        assert.equal(pkg.name, `typescript`);
    });

    it(`Resolves a package with version`, async () => {
        let pkg = await provider.getPackageByVersion(`typescript`, `3.5.1`);

        assert.equal(pkg.name, `typescript`);
        assert.equal(pkg.version, `3.5.1`);
    });

    it(`Resolves a package with semantic version syntax`, async () => {
        let pkg = await provider.getPackageByVersion(`typescript`, `^3.5.1`);

        assert.equal(pkg.name, `typescript`);
        assert.equal(pkg.version, `3.5.2`);
    });

    it(`Resolves multiple packages`, async () => {
        let names: PackageVersion[] = [
            ["typescript", undefined],
            ["react", undefined]
        ];

        for await(const pkgs of provider.getPackagesByVersion(names)) {
            assert.equal(pkgs.length, 2);
            assert.equal(pkgs[0].name, `typescript`);
            assert.equal(pkgs[1].name, `react`);
        }
    });

    it(`Throws on not existant package`, () => {
        assert.rejects(() => provider.getPackageByVersion(`abdfoodoesn'texist`), Error, `Correctly threw an error`);
    });
});