import * as path from "path";

import { DumpPackageProvider } from "../../build/src/providers/folder";

describe(`DumpProvider Tests`, () => {
    const folder = path.join("tests", "data", "multiple");

    let provider: DumpPackageProvider;

    beforeAll(() => {
        provider = new DumpPackageProvider(folder);
    });

    it(`Correctly retrieves based on version`, async () => {
        const pkgJson = await provider.getPackageJson(`typescript`, `4.5.2`);

        expect(pkgJson.name).toBe(`typescript`);
        expect(pkgJson.version).toBe(`4.5.2`);
    });

    it(`Correctly retrieves latest version`, async () => {
        const pkgJson = await provider.getPackageJson(`typescript`);

        expect(pkgJson.name).toBe(`typescript`);
        expect(pkgJson.version).toBe(`4.8.2`);
    });

    it(`Correctly retrieves metadata`, async () => {
        const data = await provider.getPackageMetadata(`typescript`);

        expect(data).toBeDefined();
        expect(data?.time).toBeDefined();
    });

    afterAll(() => {});
});
