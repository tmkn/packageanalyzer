import * as path from "path";

import { FileSystemPackageProvider } from "../src/providers/folder";
import { Package } from "../src/package/package";
import { Visitor } from "../src/visitors/visitor";
import { OraLogger } from "../src/loggers/OraLogger";
import { LicenseUtilities } from "../src/extensions/utilities/LicenseUtilities";
import { DependencyUtilities } from "../src/extensions/utilities/DependencyUtilities";

describe(`visitFromFolder Tests`, () => {
    let p: Package;

    beforeAll(async () => {
        const destination = path.join("tests", "data", "testproject2", "node_modules");
        const provider: FileSystemPackageProvider = new FileSystemPackageProvider(destination);

        const visitor = new Visitor(["webpack"], provider, new OraLogger());
        p = await visitor.visit();
    });

    test(`Checks name`, () => {
        expect(p.name).toBe(`webpack`);
    });

    test(`Checks version`, () => {
        expect(p.version).toBe(`4.35.2`);
    });

    test(`Checks fullName`, () => {
        expect(p.fullName).toBe(`webpack@4.35.2`);
    });

    test(`Checks loop`, () => {
        expect(p.isLoop).toBe(false);
    });

    test(`Checks transitive dependencies`, () => {
        expect(new DependencyUtilities(p).transitiveCount).toBe(4279);
    });

    test(`Checks distinct dependencies by name`, () => {
        expect(new DependencyUtilities(p).distinctNameCount).toBe(308);
    });

    test(`Checks distinct dependencies by name and version`, () => {
        expect(new DependencyUtilities(p).distinctVersionCount).toBe(333);
    });

    test(`Checks visit method`, () => {
        let count = 0;

        p.visit(() => count++);

        expect(count).toBe(4279);
    });

    test(`Checks visit method with self`, () => {
        let count = 0;

        p.visit(() => count++, true);

        expect(count).toBe(4280);
    });

    test(`Test getPackagesBy`, () => {
        const matches = p.getPackagesBy(p => p.name === "@webassemblyjs/wast-parser");

        expect(matches.length).toBe(25);

        for (const pkg of matches) {
            expect(pkg.name).toBe("@webassemblyjs/wast-parser");
        }
    });

    test(`Test getPackagesByName`, () => {
        const matches = p.getPackagesByName("has-value");

        expect(matches.length).toBe(32);

        for (const pkg of matches) {
            expect(pkg.name).toBe("has-value");
        }
    });

    test(`Test getPackagesByName with version`, () => {
        const matches = p.getPackagesByName("has-value", "1.0.0");

        expect(matches.length).toBe(16);

        for (const pkg of matches) {
            expect(pkg.name).toBe("has-value");
        }
    });

    test(`Test getPackageByName`, () => {
        const match = p.getPackageByName("has-value");

        expect.assertions(2);

        expect(match).not.toBe(null);
        expect(match!.name).toBe("has-value"); //eslint-disable-line
    });

    test(`Test getPackageByName with version`, () => {
        const match = p.getPackageByName("has-value", "1.0.0");

        expect.assertions(3);

        expect(match).not.toBe(null);
        expect(match!.name).toBe("has-value"); //eslint-disable-line
        expect(match!.version).toBe("1.0.0"); //eslint-disable-line
    });

    test(`Test getPackageByName with version`, () => {
        const match = p.getPackageByName("has-value", "123.456.789");

        expect(match).toBe(null);
    });

    test(`Test getPackageByName with non existant package`, () => {
        const match = p.getPackageByName("doesntexist");

        expect(match).toBe(null);
    });

    test(`Test getPackageByName with non existant package and version`, () => {
        const match = p.getPackageByName("doesntexist", "1.0.0");

        expect(match).toBe(null);
    });

    test(`Test getData`, () => {
        const name = p.getData("name");
        const version = p.getData("version");
        const dependencies = p.getData("dependencies");
        const license = p.getData("license");
        const scriptsTest = p.getData("scripts.test");
        const missing = p.getData("adf.sdf.esdf");

        expect.assertions(6);

        if (dependencies) {
            expect(name).toBe("webpack");
            expect(version).toBe("4.35.2");
            expect(Object.keys(dependencies as object).length).toBe(24);
            expect(license).toBe("MIT");
            expect(typeof scriptsTest).toBe("string");
            expect(missing).toBeUndefined();
        }
    });

    test(`Test group packages by license`, () => {
        const [{ license, names }, ...rest] = new LicenseUtilities(p).licensesByGroup;

        expect(license).toBe("MIT");
        expect(names.length).toBe(239);

        expect(rest[0].license).toBe("ISC");
        expect(rest[0].names.length).toBe(51);
    });
});

describe(`Visitor Max Depth Tests`, () => {
    function getPackage(depth: number): Promise<Package> {
        const destination = path.join("tests", "data", "testproject2", "node_modules");
        const provider: FileSystemPackageProvider = new FileSystemPackageProvider(destination);

        const visitor = new Visitor(["webpack"], provider, new OraLogger(), [], depth);

        return visitor.visit();
    }

    test(`Max depth: Infinity`, async () => {
        const p = await getPackage(Infinity);
        let libCount: number = 0;

        p.visit(() => libCount++, true);

        expect(libCount).toBe(4280);
    });

    test(`Max depth: 1`, async () => {
        const p = await getPackage(1);
        let libCount: number = 0;

        p.visit(() => libCount++, true);

        expect(libCount).toBe(25);
    });

    test(`Max depth: 2`, async () => {
        const p = await getPackage(2);
        let libCount: number = 0;

        p.visit(() => libCount++, true);

        expect(libCount).toBe(114);
    });
});
