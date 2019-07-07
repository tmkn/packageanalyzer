import * as assert from "assert";
import * as path from "path";

import { NodeModulesProvider } from "../src/providers/folderProvider";
import { PackageAnalytics } from "../src/analyzer";
import { resolveFromFolder } from "../src/resolvers/folderResolver";

describe(`resolveFromFolder Tests`, () => {
    let pa: PackageAnalytics;

    before(async () => {
        const destination = path.join("tests", "data", "testproject2", "node_modules");
        const provider: NodeModulesProvider = new NodeModulesProvider(destination);

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
});
