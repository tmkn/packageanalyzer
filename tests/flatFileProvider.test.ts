import * as path from "path";
import * as assert from "assert";

import { FlatFileProvider } from "../src/providers/flatFile";
import { PackageVersion } from "../src/npm";

describe(`flatFileProvider Tests`, () => {
    const destination = path.join("tests", "data", "npmdump");
    const file = path.join(destination, `test.json`);
    const lookupFile = path.join(destination, `test.lookup.txt`);
    let provider: FlatFileProvider;

    before(() => {
        provider = new FlatFileProvider(file, lookupFile);
    });

    it(`Get latest version`, async () => {
        const pkg = await provider.getPackageByVersion(`ux-company-announcement`);

        assert.equal(pkg.version, "1.4.1");
    });

    it(`Get specific version`, async () => {
        const pkg = await provider.getPackageByVersion(`ux-company-announcement`, `1.1.1`);

        assert.equal(pkg.version, "1.1.1");
    });

    it(`Get by semantic version`, async () => {
        const pkg = await provider.getPackageByVersion(`ux-company-announcement`, `^2.0.0`);

        assert.equal(pkg.version, "2.1.2");
    });

    it(`Get non existant version`, async () => {
        let thrown = false;

        try {
            await provider.getPackageByVersion(`ux-company-announcement`, `9.1.1`);
        } catch (e) {
            thrown = true;
            assert.ok(e instanceof Error, `catch var is not of type Error`);
        }

        assert.equal(thrown, true, `Should have thrown an error on non existant version`);
    });

    it(`Get non existant package`, async () => {
        let thrown = false;

        try {
            await provider.getPackageByVersion(`doesntexist`);
        } catch (e) {
            thrown = true;
            assert.ok(e instanceof Error, `catch var is not of type Error`);
        }

        assert.equal(thrown, true, `Should have thrown an error on non existant package`);
    });

    it(`Get packages`, async () => {
        const packages: PackageVersion[] = [
            [`ux-company-announcement`, `1.1.1`],
            [`ux-copy-job-page`]
        ];

        for await (const pkg of provider.getPackagesByVersion(packages)) {
            if (pkg.name === `ux-company-announcement`) assert.equal(pkg.version, `1.1.1`);
            else if (pkg.name === `ux-copy-job-page`) assert.equal(pkg.version, `2.0.48`);
        }
    });
});
