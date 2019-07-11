import * as path from "path";
import * as assert from "assert";

import { PackageAnalytics, getNameAndVersion } from "../src/analyzer";
import { NodeModulesProvider } from "../src/providers/folderProvider";
import { resolveFromFolder } from "../src/resolvers/folderResolver";

describe(`PackageAnalytics Tests`, () => {
    let pa: PackageAnalytics;

    before(async () => {
        pa = await resolveFromFolder(path.join("tests", "data", "testproject1"));
    });

    it(`Check licenses`, () => {
        const licenses = pa.licenses;

        assert.equal(licenses.size, 8);

        for (const [name, [[version, license]]] of licenses) {
            switch (name) {
                case "testproject1":
                case "react":
                case "loose-envify":
                case "js-tokens":
                case "object-assign":
                case "prop-types":
                case "react-is":
                case "scheduler":
                    assert.equal(true, true);
                    break;
                default:
                    assert.fail(`Didn't find all packages correctly`);
            }

            switch (version) {
                case "1.0.0":
                case "16.8.6":
                case "1.4.0":
                case "4.0.0":
                case "4.1.1":
                case "15.7.2":
                case "16.8.6":
                case "0.13.6":
                    assert.equal(true, true);
                    break;
                default:
                    assert.fail(`Didn't find all versions correctly`);
            }

            switch (license) {
                case "ISC":
                case "MIT":
                    assert.equal(true, true);
                    break;
                default:
                    assert.fail(`Didn't find all licenses correctly`);
            }
        }
    });

    it(`Checks package with most direct dependencies`, () => {
        const mostDeps = pa.mostDependencies;

        assert.equal(mostDeps.name, "react");
        assert.equal(mostDeps.version, "16.8.6");
        assert.equal(mostDeps.directDependencyCount, 4);
    });

    it(`Checks package that is most referred`, () => {
        const [name, times] = pa.mostReferred;

        assert.equal(name, "loose-envify");
        assert.equal(times, 3);
    });

    it(`Checks for package with most versions`, async () => {
        let pa: PackageAnalytics = await resolveFromFolder(
            path.join("tests", "data", "testproject2")
        );

        for (const [name, versions] of pa.mostVersions) {
            assert.equal(name, "kind-of");

            assert.equal(versions.has("3.2.2"), true);
            assert.equal(versions.has("4.0.0"), true);
            assert.equal(versions.has("5.1.0"), true);
            assert.equal(versions.has("6.0.2"), true);
        }
    });

    it(`Checks for package with most versions (all equal)`, () => {
        const mostVersions = pa.mostVersions;

        assert.equal(mostVersions.size, 8);

        for (const [name, versions] of mostVersions) {
            assert.equal(versions.size, 1);

            switch (name) {
                case "testproject1":
                case "react":
                case "loose-envify":
                case "js-tokens":
                case "object-assign":
                case "prop-types":
                case "react-is":
                case "scheduler":
                    assert.equal(true, true);
                    break;
                default:
                    assert.fail(`Didn't find all packages correctly`);
            }

            for (const version of versions) {
                switch (version) {
                    case "1.0.0":
                    case "16.8.6":
                    case "1.4.0":
                    case "4.0.0":
                    case "4.1.1":
                    case "15.7.2":
                    case "16.8.6":
                    case "0.13.6":
                        assert.equal(true, true);
                        break;
                    default:
                        assert.fail(`Didn't find all versions correctly`);
                }
            }
        }
    });

    it.skip(`Checks cost`, () => {
        let cost = pa.cost;
    });

    it(`Check path for root`, () => {
        let path = pa.path;
        let [[name, version]] = path;

        assert.equal(path.length, 1);
        assert.equal(name, "testproject1");
        assert.equal(version, "1.0.0");
    });

    it(`Check path for specific package`, () => {
        let pa2 = pa.getPackageByName("loose-envify", "1.4.0");

        if (pa2) {
            let path = pa2.path;
            let [[name1, version1], [name2, version2], [name3, version3]] = path;

            assert.equal(path.length, 3);

            assert.equal(name1, "testproject1");
            assert.equal(version1, "1.0.0");

            assert.equal(name2, "react");
            assert.equal(version2, "16.8.6");

            assert.equal(name3, "loose-envify");
            assert.equal(version3, "1.4.0");
        } else {
            assert.fail(`Couldn't find package`);
        }
    });

    it(`Check all`, () => {
        assert.equal(pa.all.length, 14);
    });

    it(`Check loops`, () => {
        assert.equal(pa.loops.length, 0);
    });
});

describe(`Checks Name and Version extraction`, () => {
    it(`Finds name and version`, () => {
        let [name, version] = getNameAndVersion(`foo@1.2.3`);

        assert.equal(name, "foo");
        assert.equal(version, "1.2.3");
    });

    it(`Finds name and version for local package`, () => {
        let [name, version] = getNameAndVersion(`@foo@1.2.3`);

        assert.equal(name, "@foo");
        assert.equal(version, "1.2.3");
    });

    it(`Finds only name`, () => {
        let [name, version] = getNameAndVersion(`foo`);

        assert.equal(name, "foo");
        assert.equal(version, undefined);
    });

    it(`Finds only name for local package`, () => {
        let [name, version] = getNameAndVersion(`@foo`);

        assert.equal(name, "@foo");
        assert.equal(version, undefined);
    });

    it(`Fails to parse, throws local package 1`, () => {
        assert.throws(() => getNameAndVersion(`@foo@`));
    });

    it(`Fails to parse, throws for local package 2`, () => {
        assert.throws(() => getNameAndVersion(`@foo@@ bla`));
    });

    it(`Fails to parse, throws for local package 3`, () => {
        assert.throws(() => getNameAndVersion(`@@foo@@ bla`));
    });

    it(`Fails to parse, throws for package 1 `, () => {
        assert.throws(() => getNameAndVersion(`foo@`));
    });

    it(`Fails to parse, throws for package 2`, () => {
        assert.throws(() => getNameAndVersion(`foo@2@ bla`));
    });
});
