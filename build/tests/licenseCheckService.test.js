"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const logger_1 = require("../src/utils/logger");
const folder_1 = require("../src/providers/folder");
const licenseCheckService_1 = require("../src/utils/licenseCheckService");
const visitor_1 = require("../src/visitors/visitor");
const utils_1 = require("../src/visitors/utils");
describe(`License Check Service Tests`, () => {
    let p;
    beforeAll(async () => {
        const rootPath = path.join("tests", "data", "testproject1");
        const provider = new folder_1.FileSystemPackageProvider(rootPath);
        const visitor = new visitor_1.Visitor((0, utils_1.getPackageVersionFromPackageJson)(rootPath), provider, new logger_1.OraLogger());
        p = await visitor.visit();
    });
    test(`Whitelist Test Ok`, async () => {
        const report = (0, licenseCheckService_1.createWhitelistLicenseCheckReport)(p, [`MIT`], false);
        expect(report.ok).toEqual(true);
        expect(report.allChecks.size).toEqual(7);
        expect(report.failedChecks.size).toEqual(0);
        expect(report.passedChecks.size).toEqual(7);
    });
    test(`Whitelist Test Failed`, async () => {
        const report = (0, licenseCheckService_1.createWhitelistLicenseCheckReport)(p, [`abc`], false);
        expect(report.ok).toEqual(false);
        expect(report.allChecks.size).toEqual(7);
        expect(report.failedChecks.size).toEqual(7);
        expect(report.passedChecks.size).toEqual(0);
    });
});
//# sourceMappingURL=licenseCheckService.test.js.map