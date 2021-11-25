"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const folder_1 = require("../src/providers/folder");
const package_1 = require("../src/package/package");
const LicenseUtilities_1 = require("../src/extensions/utilities/LicenseUtilities");
describe(`License Tests`, () => {
    let provider;
    beforeAll(() => {
        const destination = path.join("tests", "data", "licensetests");
        provider = new folder_1.FileSystemPackageProvider(destination);
    });
    test(`Check react license`, async () => {
        const dep = await provider.getPackageJson("react");
        const p = new package_1.Package(dep);
        expect(new LicenseUtilities_1.LicenseUtilities(p).license).toBe(`MIT`);
    });
    test(`Check deep-is license`, async () => {
        const dep = await provider.getPackageJson("deep-is");
        const p = new package_1.Package(dep);
        expect(new LicenseUtilities_1.LicenseUtilities(p).license).toBe(`MIT`);
    });
    test(`Check license for complex type`, async () => {
        const dep = await provider.getPackageJson("wronglicense");
        const p = new package_1.Package(dep);
        expect(new LicenseUtilities_1.LicenseUtilities(p).license).toEqual(`{"foo":{"bar":"MIT"}}`);
    });
    test(`No license check`, async () => {
        const dep = await provider.getPackageJson("wronglicense2");
        const p = new package_1.Package(dep);
        expect(new LicenseUtilities_1.LicenseUtilities(p).license.startsWith(`PARSE ERROR`)).toBe(true);
    });
});
//# sourceMappingURL=license.test.js.map