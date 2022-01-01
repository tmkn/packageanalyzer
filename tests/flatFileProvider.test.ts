import * as path from "path";

import { FlatFileProvider } from "../src/providers/flatFile";

describe(`flatFileProvider Tests`, () => {
    const destination = path.join("tests", "data", "npmdump");
    const file = path.join(destination, `test.json`);
    let provider: FlatFileProvider;

    beforeAll(() => {
        provider = new FlatFileProvider(file);
    });

    test(`Get latest version`, async () => {
        const pkg = await provider.getPackageJson(`ux-company-announcement`);

        expect(pkg.version).toBe("1.4.1");
    });

    test(`Get specific version`, async () => {
        const pkg = await provider.getPackageJson(`ux-company-announcement`, `1.1.1`);

        expect(pkg.version).toBe("1.1.1");
    });

    test(`Get by semantic version`, async () => {
        const pkg = await provider.getPackageJson(`ux-company-announcement`, `^2.0.0`);

        expect(pkg.version).toBe("2.1.2");
    });

    test(`Get non existant version`, async () => {
        expect.assertions(1);

        try {
            await provider.getPackageJson(`ux-company-announcement`, `9.1.1`);
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });

    test(`Get non existant package`, async () => {
        expect.assertions(1);

        try {
            await provider.getPackageJson(`doesntexist`);
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });

    test(`Get packages`, async () => {
        const dep1 = await provider.getPackageJson(`ux-company-announcement`, `1.1.1`);
        const dep2 = await provider.getPackageJson(`ux-copy-job-page`);

        expect(dep1.version).toBe(`1.1.1`);
        expect(dep2.version).toBe(`2.0.48`);
    });

    test(`Get package info`, async () => {
        const pkgInfo = await provider.getPackageInfo(`ux-company-announcement`);

        expect(pkgInfo).not.toBe(undefined);
    });
});
