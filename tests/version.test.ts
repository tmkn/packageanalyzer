import * as assert from "assert";
import * as path from "path";

import { FileSystemPackageProvider } from "../src/providers/folder";
import { PackageAnalytics } from "../src/analyzers/package";

describe(`License Tests`, async () => {
    let provider: FileSystemPackageProvider;

    before(() => {
        const destination = path.join("tests", "data", "licensetests");
        provider = new FileSystemPackageProvider(destination);
    });

    it(`Check react license`, async () => {
        const dep = await provider.getPackageByVersion("react");
        const pa = new PackageAnalytics(dep);

        assert.equal(pa.license, `MIT`);
    });

    it(`Check deep-is license`, async () => {
        const dep = await provider.getPackageByVersion("deep-is");
        const pa = new PackageAnalytics(dep);

        assert.equal(pa.license, `MIT`);
    });

    it(`Check license for complex type`, async () => {
        const dep = await provider.getPackageByVersion("wronglicense");
        const pa = new PackageAnalytics(dep);

        assert.equal(pa.license, `{"foo":{"bar":"MIT"}}`);
    });

    it(`No license check`, async () => {
        const dep = await provider.getPackageByVersion("wronglicense2");
        const pa = new PackageAnalytics(dep);

        assert.equal(pa.license.startsWith(`PARSE ERROR`), true);
    });
});