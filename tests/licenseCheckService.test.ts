import * as path from "path";

import { Package } from "../src/package/package";
import { OraLogger } from "../src/utils/logger";
import { FileSystemPackageProvider } from "../src/providers/folder";
import { createWhitelistLicenseCheckReport } from "../src/utils/licenseCheckService";
import { getPackageJson, Visitor } from "../src/visitors/visitor";

describe(`License Check Service Tests`, () => {
    let p: Package;

    beforeAll(async () => {
        const rootPath = path.join("tests", "data", "testproject1");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageJson(rootPath), provider, new OraLogger());

        p = await visitor.visit();
    });

    test(`Whitelist Test Ok`, async () => {
        const report = createWhitelistLicenseCheckReport(p, [`MIT`], false);

        expect(report.ok).toEqual(true);
        expect(report.allChecks.size).toEqual(7);
        expect(report.failedChecks.size).toEqual(0);
        expect(report.passedChecks.size).toEqual(7);
    });

    test(`Whitelist Test Failed`, async () => {
        const report = createWhitelistLicenseCheckReport(p, [`abc`], false);

        expect(report.ok).toEqual(false);
        expect(report.allChecks.size).toEqual(7);
        expect(report.failedChecks.size).toEqual(7);
        expect(report.passedChecks.size).toEqual(0);
    });
});
