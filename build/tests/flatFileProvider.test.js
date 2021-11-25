"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const flatFile_1 = require("../src/providers/flatFile");
describe(`flatFileProvider Tests`, () => {
    const destination = path.join("tests", "data", "npmdump");
    const file = path.join(destination, `test.json`);
    let provider;
    beforeAll(() => {
        provider = new flatFile_1.FlatFileProvider(file);
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
        }
        catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
    test(`Get non existant package`, async () => {
        expect.assertions(1);
        try {
            await provider.getPackageJson(`doesntexist`);
        }
        catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
    test(`Get packages`, async () => {
        const packages = [
            [`ux-company-announcement`, `1.1.1`],
            [`ux-copy-job-page`]
        ];
        for await (const pkg of provider.getPackageJsons(packages)) {
            if (pkg.name === `ux-company-announcement`)
                expect(pkg.version).toBe(`1.1.1`);
            else if (pkg.name === `ux-copy-job-page`)
                expect(pkg.version).toBe(`2.0.48`);
        }
    });
    test(`Get package info`, async () => {
        const pkgInfo = await provider.getPackageInfo(`ux-company-announcement`);
        expect(pkgInfo).not.toBe(undefined);
    });
});
//# sourceMappingURL=flatFileProvider.test.js.map