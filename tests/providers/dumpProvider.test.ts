import * as path from "path";

import { DumpPackageProvider } from "../../build/src/providers/folder";

describe(`DumpProvider Tests`, () => {
    const folder = path.join("tests", "data", "dump");

    let provider: DumpPackageProvider;

    beforeAll(() => {
        provider = new DumpPackageProvider(folder);
    });

    it(`Correctly retrieves based on version`, async () => {
        const pkgJson = await provider.getPackageJson(`react`, `17.0.2`);

        expect(pkgJson.name).toBe(`react`);
        expect(pkgJson.version).toBe(`17.0.2`);
    });

    it(`Correctly retrieves latest version`, async () => {
        const pkgJson = await provider.getPackageJson(`react`);

        expect(pkgJson.name).toBe(`react`);
        expect(pkgJson.version).toBe(`18.2.0`);
    });

    it(`Correctly retrieves metadata`, async () => {
        const data = await provider.getPackageMetadata(`react`);

        expect(data).toBeDefined();
        expect(data?.time).toBeDefined();
    });

    afterAll(() => {});
});
