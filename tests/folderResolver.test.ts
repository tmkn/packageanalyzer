import * as assert from "assert";
import * as path from "path";

import { PackageAnalytics } from "../src/analyzers/package";
import { resolveFromFolder } from "../src/resolvers/folder";
import { resolveFromName } from "../src/resolvers/name";
import { IPackageProvider } from "../src/providers/folder";
import { INpmPackage } from "../src/npm";

describe(`resolveFromFolder Tests`, () => {
    let pa: PackageAnalytics;

    before(async () => {
        pa = await resolveFromFolder(path.join("tests", "data", "testproject2"));
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
            await resolveFromFolder(`folderdoesntexist`);
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

        getPackageByVersion(name: string, version?: string | undefined): Promise<INpmPackage> {
            throw new CustomError(`getPackageByVersion not implemented`);
        }

        getPackagesByVersion(
            modules: [string, string | undefined][]
        ): AsyncIterableIterator<INpmPackage[]> {
            throw new Error(`getPackagesByVersion not implemented`);
        }
    }

    it(`Correctly propagates an exception`, async () => {
        try {
            await resolveFromName("wurscht", new MockProvider());

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
