import * as path from "path";

import { FileSystemPackageProvider } from "../src/providers/folder";
import { PackageAnalytics } from "../src/analyzers/package";

describe.only(`License Tests`, () => {
    let provider: FileSystemPackageProvider;

    beforeAll(() => {
        const destination = path.join("tests", "data", "licensetests");
        provider = new FileSystemPackageProvider(destination);
    });

    test(`Check react license`, async () => {
        const dep = await provider.getPackageByVersion("react");
        const pa = new PackageAnalytics(dep);

        expect(pa.license).toBe(`MIT`);
    });

    test(`Check deep-is license`, async () => {
        const dep = await provider.getPackageByVersion("deep-is");
        const pa = new PackageAnalytics(dep);

        expect(pa.license).toBe(`MIT`);
    });

    test(`Check license for complex type`, async () => {
        const dep = await provider.getPackageByVersion("wronglicense");
        const pa = new PackageAnalytics(dep);

        expect(pa.license).toEqual(`{"foo":{"bar":"MIT"}}`);
    });

    test(`No license check`, async () => {
        const dep = await provider.getPackageByVersion("wronglicense2");
        const pa = new PackageAnalytics(dep);

        expect(pa.license.startsWith(`PARSE ERROR`)).toBe(true);
    });
});
