import * as path from "path";

import { FileSystemPackageProvider } from "../src/providers/folder";
import { Package } from "../src/package/package";
import { LicenseMetrics } from "../src/extensions/metrics/LicenseMetrics";

describe(`License Tests`, () => {
    let provider: FileSystemPackageProvider;

    beforeAll(() => {
        const destination = path.join("tests", "data", "licensetests");
        provider = new FileSystemPackageProvider(destination);
    });

    test(`Check react license`, async () => {
        const dep = await provider.getPackageByVersion("react");
        const p = new Package(dep);

        expect(new LicenseMetrics(p).license).toBe(`MIT`);
    });

    test(`Check deep-is license`, async () => {
        const dep = await provider.getPackageByVersion("deep-is");
        const p = new Package(dep);

        expect(new LicenseMetrics(p).license).toBe(`MIT`);
    });

    test(`Check license for complex type`, async () => {
        const dep = await provider.getPackageByVersion("wronglicense");
        const p = new Package(dep);

        expect(new LicenseMetrics(p).license).toEqual(`{"foo":{"bar":"MIT"}}`);
    });

    test(`No license check`, async () => {
        const dep = await provider.getPackageByVersion("wronglicense2");
        const p = new Package(dep);

        expect(new LicenseMetrics(p).license.startsWith(`PARSE ERROR`)).toBe(true);
    });
});
