import { describe, test, expect, beforeAll } from "vitest";
import * as path from "path";

import { type IPackage } from "../../shared/src/package/package.js";
import { OraLogger } from "../src/loggers/OraLogger.js";
import { FileSystemPackageProvider } from "../src/providers/folder.js";
import { createWhitelistLicenseCheckReport } from "../src/utils/licenseCheckService.js";
import { Visitor } from "../../shared/src/visitors/visitor.js";
import { getPackageVersionFromPath } from "../src/visitors/util.node.js";

describe(`License Check Service Tests`, () => {
    let p: IPackage;

    beforeAll(async () => {
        const rootPath = path.join("packages", "node", "tests", "data", "testproject1");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageVersionFromPath(rootPath), provider, new OraLogger());

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
