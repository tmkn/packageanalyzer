import * as path from "path";

import { FileSystemPackageProvider } from "../src/providers/folder";
import { Package } from "../src/package/package";
import { LicenseUtilities } from "../src/extensions/utilities/LicenseUtilities";

describe(`License Tests`, () => {
    let provider: FileSystemPackageProvider;

    beforeAll(() => {
        const destination = path.join("tests", "data", "licensetests");
        provider = new FileSystemPackageProvider(destination);
    });

    test(`Check react license`, async () => {
        const dep = await provider.getPackageJson("react");
        const p = new Package(dep);

        expect(new LicenseUtilities(p).license).toBe(`MIT`);
    });

    test(`Check deep-is license`, async () => {
        const dep = await provider.getPackageJson("deep-is");
        const p = new Package(dep);

        expect(new LicenseUtilities(p).license).toBe(`MIT`);
    });

    test(`Check license for complex type`, async () => {
        const dep = await provider.getPackageJson("wronglicense");
        const p = new Package(dep);

        expect(new LicenseUtilities(p).license).toEqual(`{"foo":{"bar":"MIT"}}`);
    });

    test(`No license check`, async () => {
        const dep = await provider.getPackageJson("wronglicense2");
        const p = new Package(dep);

        expect(new LicenseUtilities(p).license.startsWith(`PARSE ERROR`)).toBe(true);
    });
});
