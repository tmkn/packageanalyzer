import * as path from "path";

import { FileSystemPackageProvider } from "../src/providers/folder";
import { PackageAnalytics } from "../src/analyzers/package";
import { Resolver } from "../src/resolvers/resolver";
import { OraLogger } from "../src/logger";

describe(`resolveFromFolder Tests`, () => {
    let pa: PackageAnalytics;

    beforeAll(async () => {
        const destination = path.join("tests", "data", "testproject2", "node_modules");
        const provider: FileSystemPackageProvider = new FileSystemPackageProvider(destination);

        const resolver = new Resolver(() => "webpack", provider, new OraLogger());
        pa = await resolver.resolve();
    });

    test(`Checks name`, () => {
        expect(pa.name).toBe(`webpack`);
    });

    test(`Checks version`, () => {
        expect(pa.version).toBe(`4.35.2`);
    });

    test(`Checks fullName`, () => {
        expect(pa.fullName).toBe(`webpack@4.35.2`);
    });

    test(`Checks loop`, () => {
        expect(pa.isLoop).toBe(false);
    });

    test(`Checks transitive dependencies`, () => {
        expect(pa.transitiveDependenciesCount).toBe(4279);
    });

    test(`Checks distinct dependencies by name`, () => {
        expect(pa.distinctByNameCount).toBe(308);
    });

    test(`Checks distinct dependencies by name and version`, () => {
        expect(pa.distinctByVersionCount).toBe(333);
    });

    test(`Checks visit method`, () => {
        let count = 0;

        pa.visit(() => count++);

        expect(count).toBe(4279);
    });

    test(`Checks visit method with self`, () => {
        let count = 0;

        pa.visit(() => count++, true);

        expect(count).toBe(4280);
    });

    test(`Test getPackagesBy`, () => {
        const matches = pa.getPackagesBy(p => p.name === "@webassemblyjs/wast-parser");

        expect(matches.length).toBe(25);

        for (const pkg of matches) {
            expect(pkg.name).toBe("@webassemblyjs/wast-parser");
        }
    });

    test(`Test getPackagesByName`, () => {
        const matches = pa.getPackagesByName("has-value");

        expect(matches.length).toBe(32);

        for (const pkg of matches) {
            expect(pkg.name).toBe("has-value");
        }
    });

    test(`Test getPackagesByName with version`, () => {
        const matches = pa.getPackagesByName("has-value", "1.0.0");

        expect(matches.length).toBe(16);

        for (const pkg of matches) {
            expect(pkg.name).toBe("has-value");
        }
    });

    test(`Test getPackageByName`, () => {
        const match = pa.getPackageByName("has-value");

        expect.assertions(2);

        expect(match).not.toBe(null);
        expect(match!.name).toBe("has-value"); //eslint-disable-line
    });

    test(`Test getPackageByName with version`, () => {
        const match = pa.getPackageByName("has-value", "1.0.0");

        expect.assertions(3);

        expect(match).not.toBe(null);
        expect(match!.name).toBe("has-value"); //eslint-disable-line
        expect(match!.version).toBe("1.0.0"); //eslint-disable-line
    });

    test(`Test getPackageByName with version`, () => {
        const match = pa.getPackageByName("has-value", "123.456.789");

        expect(match).toBe(null);
    });

    test(`Test getPackageByName with non existant package`, () => {
        const match = pa.getPackageByName("doesntexist");

        expect(match).toBe(null);
    });

    test(`Test getPackageByName with non existant package and version`, () => {
        const match = pa.getPackageByName("doesntexist", "1.0.0");

        expect(match).toBe(null);
    });

    test(`Test getData`, () => {
        const name = pa.getData("name");
        const version = pa.getData("version");
        const dependencies = pa.getData("dependencies");
        const license = pa.getData("license");

        expect.assertions(4);

        if (dependencies) {
            expect(name).toBe("webpack");
            expect(version).toBe("4.35.2");
            expect(Object.keys(dependencies).length).toBe(24);
            expect(license).toBe("MIT");
        }
    });

    test(`Test group packages by license`, () => {
        const [{ license, names }, ...rest] = pa.licensesByGroup;

        expect(license).toBe("MIT");
        expect(names.length).toBe(239);

        expect(rest[0].license).toBe("ISC");
        expect(rest[0].names.length).toBe(51);
    });

    test(`Test published`, () => {
        expect(pa.published).toBe(undefined);
    });

    test(`Test oldest`, () => {
        expect(pa.oldest).toBe(undefined);
    });

    test(`Test newest`, () => {
        expect(pa.newest).toBe(undefined);
    });
});
