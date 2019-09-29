import * as assert from "assert";
import * as path from "path";

import { PackageAnalytics } from "../src/analyzers/package";
import { fromFolder } from "../src/resolvers/folder";
import { IPackageProvider, FileSystemPackageProvider } from "../src/providers/folder";
import { INpmPackage } from "../src/npm";
import { Resolver } from "../src/resolvers/resolver";
import { OraLogger } from "../src/logger";

describe(`resolveFromFolder Tests`, () => {
    let pa: PackageAnalytics;

    before(async () => {
        const rootPath = path.join("tests", "data", "testproject2");
        const provider = new FileSystemPackageProvider(rootPath);
        const resolver = new Resolver(fromFolder(rootPath), provider, new OraLogger());

        pa = await resolver.resolve();
    });

    it(`Checks name`, () => {
        assert.equal(`testproject2`, pa.name);
    });

    it(`Checks version`, () => {
        assert.equal(`1.0.0`, pa.version);
    });

    it(`Checks fullName`, () => {
        assert.equal(`${pa.name}@${pa.version}`, pa.fullName);
    });

    it(`Checks license`, () => {
        assert.equal(`ISC`, pa.license);
    });

    it(`Throws on missing package.json`, async () => {
        let hasThrown = false;

        try {
            const rootPath = `folderdoesntexist`;
            const provider = new FileSystemPackageProvider(rootPath);
            const resolver = new Resolver(fromFolder(rootPath), provider, new OraLogger());

            await resolver.resolve();
        } catch {
            hasThrown = true;
        }

        assert.equal(hasThrown, true, `Did not throw on invalid path`);
    });

    it(`Check loops`, () => {
        assert.equal(pa.loops.length, 50);
    });
});

describe(`resolveFromName Error Handling`, () => {
    class CustomError extends Error {
        constructor(msg: string) {
            super(msg);
        }
    }

    class MockProvider implements IPackageProvider {
        size = 0;

        getPackageByVersion(
            name: string /* eslint-disable-line */,
            version?: string | undefined /* eslint-disable-line */
        ): Promise<INpmPackage> {
            throw new CustomError(`getPackageByVersion not implemented`);
        }

        getPackagesByVersion(
            modules: [string, string?][] /* eslint-disable-line */
        ): AsyncIterableIterator<INpmPackage[]> {
            throw new Error(`getPackagesByVersion not implemented`);
        }
    }

    it(`Correctly propagates an exception`, async () => {
        try {
            const resolver = new Resolver(() => "wurscht", new MockProvider(), new OraLogger());
            await resolver.resolve();

            assert.fail(`Should have thrown an exception`);
        } catch (e) {
            if (e instanceof CustomError) {
                assert.ok(e, `Correctly propagated the exception: ${e}`);
            } else {
                assert.fail(`Wrong Exception type`);
            }
        }
    });
});
