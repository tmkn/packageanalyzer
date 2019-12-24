import * as path from "path";

import { PackageAnalytics } from "../src/analyzers/package";
import { getPackageJson } from "../src/resolvers/folder";
import { IPackageVersionProvider, FileSystemPackageProvider } from "../src/providers/folder";
import { INpmPackageVersion } from "../src/npm";
import { Resolver } from "../src/resolvers/resolver";
import { OraLogger } from "../src/logger";

describe(`resolveFromFolder Tests`, () => {
    let pa: PackageAnalytics;

    beforeAll(async () => {
        const rootPath = path.join("tests", "data", "testproject2");
        const provider = new FileSystemPackageProvider(rootPath);
        const resolver = new Resolver(getPackageJson(rootPath), provider, new OraLogger());

        pa = await resolver.resolve();
    });

    test(`Checks name`, () => {
        expect(`testproject2`).toBe(pa.name);
    });

    test(`Checks version`, () => {
        expect(`1.0.0`).toBe(pa.version);
    });

    test(`Checks fullName`, () => {
        expect(`${pa.name}@${pa.version}`).toBe(pa.fullName);
    });

    test(`Checks license`, () => {
        expect(`ISC`).toBe(pa.license);
    });

    test(`Throws on missing package.json`, async () => {
        expect.assertions(1);

        try {
            const rootPath = `folderdoesntexist`;
            const provider = new FileSystemPackageProvider(rootPath);
            const resolver = new Resolver(getPackageJson(rootPath), provider, new OraLogger());

            await resolver.resolve();
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });

    test(`Check loops`, () => {
        expect(pa.loops.length).toBe(50);
    });

    it(`Check direct dependecies`, async () => {
        const rootPath = path.join("tests", "data", "testproject1");
        const provider = new FileSystemPackageProvider(rootPath);
        const resolver = new Resolver(fromFolder(rootPath), provider, new OraLogger());

        pa = await resolver.resolve();
        const dependencies = pa.directDependencies;

        assert.equal(dependencies.length, 1);
        assert.equal(dependencies[0].fullName, `react@16.8.6`);

        const reactDependencies = dependencies[0].directDependencies;

        assert.equal(reactDependencies.length, 4);
    });
});

describe(`resolveFromName Error Handling`, () => {
    class CustomError extends Error {
        constructor(msg: string) {
            super(msg);
        }
    }

    class MockProvider implements IPackageVersionProvider {
        size = 0;

        getPackageByVersion(
            name: string /* eslint-disable-line */,
            version?: string | undefined /* eslint-disable-line */
        ): Promise<INpmPackageVersion> {
            throw new CustomError(`getPackageByVersion not implemented`);
        }

        getPackagesByVersion(
            modules: [string, string?][] /* eslint-disable-line */
        ): AsyncIterableIterator<INpmPackageVersion> {
            throw new Error(`getPackagesByVersion not implemented`);
        }
    }

    test(`Correctly propagates an exception`, async () => {
        expect.assertions(1);

        try {
            const resolver = new Resolver(["wurscht"], new MockProvider(), new OraLogger());
            await resolver.resolve();
        } catch (e) {
            expect(e).toBeInstanceOf(CustomError);
        }
    });
});
