import { describe, test, expect, beforeAll } from "vitest";
import * as path from "path";

import { FileSystemPackageProvider } from "../src/providers/folder.js";
import { LicenseUtilities } from "../src/extensions/utilities/LicenseUtilities.js";
import { createMockPackage } from "./mocks.js";

describe(`License Tests`, () => {
    let provider: FileSystemPackageProvider;

    beforeAll(() => {
        const destination = path.join("tests", "data", "licensetests");
        provider = new FileSystemPackageProvider(destination);
    });

    test(`Check react license`, async () => {
        const dep = await provider.getPackageJson("react");
        const p = createMockPackage({
            ...dep,
            dependencies: undefined,
            devDependencies: undefined
        });

        expect(new LicenseUtilities(p).license).toBe(`MIT`);
    });

    test(`Check deep-is license`, async () => {
        const dep = await provider.getPackageJson("deep-is");
        const p = createMockPackage({
            ...dep,
            dependencies: undefined,
            devDependencies: undefined
        });

        expect(new LicenseUtilities(p).license).toBe(`MIT`);
    });

    test(`Check license for complex type`, async () => {
        const dep = await provider.getPackageJson("wronglicense");
        const p = createMockPackage({
            ...dep,
            dependencies: undefined,
            devDependencies: undefined
        });

        expect(new LicenseUtilities(p).license).toEqual(`{"foo":{"bar":"MIT"}}`);
    });

    test(`No license check`, async () => {
        const dep = await provider.getPackageJson("wronglicense2");
        const p = createMockPackage({
            ...dep,
            dependencies: undefined,
            devDependencies: undefined
        });

        expect(new LicenseUtilities(p).license.startsWith(`PARSE ERROR`)).toBe(true);
    });
});
