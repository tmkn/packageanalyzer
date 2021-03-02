import * as path from "path";

import { FlatFileProvider } from "../src/providers/flatFile";
import { PackageVersion } from "../src/visitors/visitor";

describe(`flatFileProvider Tests`, () => {
    const destination = path.join("tests", "data", "npmdump");
    const file = path.join(destination, `test.json`);
    let provider: FlatFileProvider;

    beforeAll(() => {
        provider = new FlatFileProvider(file);
    });

    test(`Get latest version`, async () => {
        const pkg = await provider.getPackageByVersion(`ux-company-announcement`);

        expect(pkg.version).toBe("1.4.1");
    });

    test(`Get specific version`, async () => {
        const pkg = await provider.getPackageByVersion(`ux-company-announcement`, `1.1.1`);

        expect(pkg.version).toBe("1.1.1");
    });

    test(`Get by semantic version`, async () => {
        const pkg = await provider.getPackageByVersion(`ux-company-announcement`, `^2.0.0`);

        expect(pkg.version).toBe("2.1.2");
    });

    test(`Get non existant version`, async () => {
        expect.assertions(1);

        try {
            await provider.getPackageByVersion(`ux-company-announcement`, `9.1.1`);
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });

    test(`Get non existant package`, async () => {
        expect.assertions(1);

        try {
            await provider.getPackageByVersion(`doesntexist`);
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });

    test(`Get packages`, async () => {
        const packages: PackageVersion[] = [
            [`ux-company-announcement`, `1.1.1`],
            [`ux-copy-job-page`]
        ];

        for await (const pkg of provider.getPackagesByVersion(packages)) {
            if (pkg.name === `ux-company-announcement`) expect(pkg.version).toBe(`1.1.1`);
            else if (pkg.name === `ux-copy-job-page`) expect(pkg.version).toBe(`2.0.48`);
        }
    });

    test(`Get size`, async () => {
        expect(provider.size).toBe(10);
    });

    test(`Get package info`, async () => {
        const pkgInfo = await provider.getPackageInfo(`ux-company-announcement`);

        expect(pkgInfo).not.toBe(undefined);
    });
});
