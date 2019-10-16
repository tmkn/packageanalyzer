import * as path from "path";
import * as assert from "assert";
import * as fs from "fs";

import { FlatFileProvider } from "../src/providers/flatFile";
import { PackageVersion, INpmDumpRow } from "../src/npm";
import { LookupFileCreator, ILookupEntry } from "../src/lookup";

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

describe(`Lookup Creator Tests`, async () => {
    const destination = path.join("tests", "data", "npmdump");
    const file = path.join(destination, `test.json`);
    let lookups: readonly ILookupEntry[] = [];

    before(async () => {
        const creator = new LookupFileCreator(file);
        await creator.parse();
        lookups = creator.lookups;
    });

    it(`Correctly identified all packages`, async () => {
        assert.equal(lookups.length, 10);
    });

    it(`Correctly parsed the first package`, () => {
        const [{ name, length, offset }] = lookups;

        assert.equal(name, `ux-com-paging-break`, `Name didn't match`);
        assert.equal(length, 9865, `Length didn't match`);
        assert.equal(offset, 49, `Offset didn't match`);
    });

    it(`Correctly parsed the last package`, () => {
        const { name, length, offset } = lookups[lookups.length - 1];

        assert.equal(name, `ux-custom-ocean-compon`, `Name didn't match`);
        assert.equal(length, 42999, `Length didn't match`);
        assert.equal(offset, 617793, `Offset didn't match`);
    });

    it(`Correctly looks up a package`, async () => {
        const fd = fs.openSync(file, "r");
        const index = 5;
        const { name, offset, length } = lookups[index];
        const buffer = Buffer.alloc(length);

        //fixme calculate correct offset values
        fs.readSync(fd, buffer, 0, length, offset - index - 1);
        fs.closeSync(fd);

        const { doc: pkg }: INpmDumpRow = JSON.parse(buffer.toString());

        assert.equal(pkg.name, name);
    });
});
