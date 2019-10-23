import * as assert from "assert";
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

    it(`Checks name`, () => {
        assert.equal(pa.name, `webpack`);
    });

    it(`Checks version`, () => {
        assert.equal(pa.version, `4.35.2`);
    });

    it(`Checks fullName`, () => {
        assert.equal(pa.fullName, `webpack@4.35.2`);
    });

    it(`Checks loop`, () => {
        assert.equal(pa.isLoop, false);
    });

    it(`Checks transitive dependencies`, () => {
        assert.equal(pa.transitiveDependenciesCount, 4279);
    });

    it(`Checks distinct dependencies by name`, () => {
        assert.equal(pa.distinctByNameCount, 308);
    });

    it(`Checks distinct dependencies by name and version`, () => {
        assert.equal(pa.distinctByVersionCount, 333);
    });

    it(`Checks visit method`, () => {
        let count = 0;

        pa.visit(() => count++);

        assert.equal(count, 4279);
    });

    it(`Checks visit method with self`, () => {
        let count = 0;

        pa.visit(() => count++, true);

        assert.equal(count, 4280);
    });

    it(`Test getPackagesBy`, () => {
        const matches = pa.getPackagesBy(p => p.name === "@webassemblyjs/wast-parser");

        assert.equal(matches.length, 25);

        for (const pkg of matches) {
            assert.equal(pkg.name, "@webassemblyjs/wast-parser");
        }
    });

    it(`Test getPackagesByName`, () => {
        const matches = pa.getPackagesByName("has-value");

        assert.equal(matches.length, 32);

        for (const pkg of matches) {
            assert.equal(pkg.name, "has-value");
        }
    });

    it(`Test getPackagesByName with version`, () => {
        const matches = pa.getPackagesByName("has-value", "1.0.0");

        assert.equal(matches.length, 16);

        for (const pkg of matches) {
            assert.equal(pkg.name, "has-value");
        }
    });

    it(`Test getPackageByName`, () => {
        const match = pa.getPackageByName("has-value");

        assert.notEqual(match, null);
        assert.equal(match!.name, "has-value"); //eslint-disable-line
    });

    it(`Test getPackageByName with version`, () => {
        const match = pa.getPackageByName("has-value", "1.0.0");

        assert.notEqual(match, null);
        assert.equal(match!.name, "has-value"); //eslint-disable-line
        assert.equal(match!.version, "1.0.0"); //eslint-disable-line
    });

    it(`Test getPackageByName with version`, () => {
        const match = pa.getPackageByName("has-value", "123.456.789");

        assert.equal(match, null);
    });

    it(`Test getPackageByName with non existant package`, () => {
        const match = pa.getPackageByName("doesntexist");

        assert.equal(match, null);
    });

    it(`Test getPackageByName with non existant package and version`, () => {
        const match = pa.getPackageByName("doesntexist", "1.0.0");

        assert.equal(match, null);
    });

    it(`Test getData`, () => {
        const name = pa.getData("name");
        const version = pa.getData("version");
        const dependencies = pa.getData("dependencies");
        const license = pa.getData("license");

        if (dependencies) {
            assert.equal(name, "webpack");
            assert.equal(version, "4.35.2");
            assert.equal(Object.keys(dependencies).length, 24);
            assert.equal(license, "MIT");
        } else {
            assert.fail(`dependencies is undefined`);
        }
    });

    it(`Test group packages by license`, () => {
        const [{ license, names }, ...rest] = pa.licensesByGroup;

        assert.equal(license, "MIT");
        assert.equal(names.length, 239);

        assert.equal(rest[0].license, "ISC");
        assert.equal(rest[0].names.length, 51);
    });

    it(`Test published`, () => {
        assert.equal(pa.published, undefined);
    });

    it(`Test oldest`, () => {
        assert.equal(pa.oldest, undefined);
    });

    it(`Test newest`, () => {
        assert.equal(pa.newest, undefined);
    });
});
