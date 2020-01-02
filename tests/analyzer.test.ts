import * as path from "path";

import { PackageAnalytics } from "../src/analyzers/package";
import { getNameAndVersion } from "../src/npm";
import { getPackageJson } from "../src/visitors/folder";
import { FileSystemPackageProvider } from "../src/providers/folder";
import { Visitor } from "../src/visitors/visitor";
import { OraLogger } from "../src/logger";

describe(`PackageAnalytics Tests`, () => {
    let pa: PackageAnalytics;

    beforeAll(async () => {
        const rootPath = path.join("tests", "data", "testproject1");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageJson(rootPath), provider, new OraLogger());

        pa = await visitor.visit();
    });

    test(`Check licenses`, () => {
        const licenses = pa.licenses;

        const names: string[] = [
            "testproject1",
            "react",
            "loose-envify",
            "js-tokens",
            "object-assign",
            "prop-types",
            "react-is",
            "scheduler"
        ];
        const versions: string[] = [
            "1.0.0",
            "16.8.6",
            "1.4.0",
            "4.0.0",
            "4.1.1",
            "15.7.2",
            "16.8.6",
            "0.13.6"
        ];

        expect(licenses.size).toBe(8);

        for (const [name, [[version, license]]] of licenses) {
            expect(names).toContain(name);
            expect(versions).toContain(version);

            expect(["ISC", "MIT"]).toContain(license);
        }
    });

    test(`Checks package with most direct dependencies`, () => {
        const mostDeps = pa.mostDependencies;

        expect(mostDeps.name).toBe("react");
        expect(mostDeps.version).toBe("16.8.6");
        expect(mostDeps.directDependencyCount).toBe(4);
    });

    test(`Checks package that is most referred`, () => {
        const [name, times] = pa.mostReferred;

        expect(name).toBe("loose-envify");
        expect(times).toBe(3);
    });

    test(`Checks for package with most versions`, async () => {
        const rootPath = path.join("tests", "data", "testproject2");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageJson(rootPath), provider, new OraLogger());
        const pa: PackageAnalytics = await visitor.visit();

        for (const [name, versions] of pa.mostVersions) {
            expect(name).toBe("kind-of");

            expect(versions.has("3.2.2")).toBe(true);
            expect(versions.has("4.0.0")).toBe(true);
            expect(versions.has("5.1.0")).toBe(true);
            expect(versions.has("6.0.2")).toBe(true);
        }
    });

    test(`Checks for package with most versions (all equal)`, () => {
        const mostVersions = pa.mostVersions;

        expect(mostVersions.size).toBe(8);

        const names: string[] = [
            "testproject1",
            "react",
            "loose-envify",
            "js-tokens",
            "object-assign",
            "prop-types",
            "react-is",
            "scheduler"
        ];
        const _versions: string[] = [
            "1.0.0",
            "16.8.6",
            "1.4.0",
            "4.0.0",
            "4.1.1",
            "15.7.2",
            "16.8.6",
            "0.13.6"
        ];

        for (const [name, versions] of mostVersions) {
            expect(versions.size).toBe(1);
            expect(names).toContain(name);

            for (const version of versions) {
                expect(_versions).toContain(version);
            }
        }
    });

    test(`Checks cost`, () => {
        const cost = pa.cost;

        expect(cost).toBe(0);
    });

    test(`Checks path string`, () => {
        const react = pa.getPackageByName("react");

        expect.assertions(1);
        if (react) {
            const path = react.pathString;

            expect(path).toBe(`testproject1@1.0.0 -> react@16.8.6`);
        }
    });

    test(`Check path for root`, () => {
        const path = pa.path;
        const [[name, version]] = path;

        expect(path.length).toBe(1);
        expect(name).toBe("testproject1");
        expect(version).toBe("1.0.0");
    });

    test(`Check path for specific package`, () => {
        const pa2 = pa.getPackageByName("loose-envify", "1.4.0");

        expect.assertions(7);

        if (pa2) {
            const path = pa2.path;
            const [[name1, version1], [name2, version2], [name3, version3]] = path;

            expect(path.length).toBe(3);

            expect(name1).toBe("testproject1");
            expect(version1).toBe("1.0.0");

            expect(name2).toBe("react");
            expect(version2).toBe("16.8.6");

            expect(name3).toBe("loose-envify");
            expect(version3).toBe("1.4.0");
        }
    });

    test(`Check all`, () => {
        expect(pa.all.length).toBe(14);
    });

    test(`Check loops`, () => {
        expect(pa.loops.length).toBe(0);
    });

    test(`Checks published`, () => {
        expect(pa.published).toBe(undefined);
    });

    test(`Checks timeSpan`, () => {
        expect(() => pa.timeSpan).toThrow();
    });

    test(`Checks size`, () => {
        expect(() => pa.size).toThrow();
    });
});

describe(`Checks Name and Version extraction`, () => {
    test(`Finds name and version`, () => {
        const [name, version] = getNameAndVersion(`foo@1.2.3`);

        expect(name).toBe("foo");
        expect(version).toBe("1.2.3");
    });

    test(`Finds name and version for local package`, () => {
        const [name, version] = getNameAndVersion(`@foo@1.2.3`);

        expect(name).toBe("@foo");
        expect(version).toBe("1.2.3");
    });

    test(`Finds only name`, () => {
        const [name, version] = getNameAndVersion(`foo`);

        expect(name).toBe("foo");
        expect(version).toBe(undefined);
    });

    test(`Finds only name for local package`, () => {
        const [name, version] = getNameAndVersion(`@foo`);

        expect(name).toBe("@foo");
        expect(version).toBe(undefined);
    });

    test(`Fails to parse, throws local package 1`, () => {
        expect(() => getNameAndVersion(`@foo@`)).toThrow();
    });

    test(`Fails to parse, throws for local package 2`, () => {
        expect(() => getNameAndVersion(`@foo@@ bla`)).toThrow();
    });

    test(`Fails to parse, throws for local package 3`, () => {
        expect(() => getNameAndVersion(`@@foo@@ bla`)).toThrow();
    });

    test(`Fails to parse, throws for package 1 `, () => {
        expect(() => getNameAndVersion(`foo@`)).toThrow();
    });

    test(`Fails to parse, throws for package 2`, () => {
        expect(() => getNameAndVersion(`foo@2@ bla`)).toThrow();
    });
});
