import * as assert from "assert";
import * as path from "path";

import { PackageAnalytics } from "../src/analyzer";
import { resolveFromFolder } from "../src/resolvers/folderResolver";

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
