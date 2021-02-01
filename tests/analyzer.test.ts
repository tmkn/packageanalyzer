import * as path from "path";

import { Package } from "../src/analyzers/package";
import { getNameAndVersion } from "../src/npm";
import { getPackageJson } from "../src/visitors/folder";
import { FileSystemPackageProvider } from "../src/providers/folder";
import { Visitor } from "../src/visitors/visitor";
import { OraLogger } from "../src/logger";
import { Writable } from "stream";
import { Formatter } from "../src/formatter";

describe(`Package Tests`, () => {
    let p: Package;

    beforeAll(async () => {
        const rootPath = path.join("tests", "data", "testproject1");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageJson(rootPath), provider, new OraLogger());

        p = await visitor.visit();
    });

    test(`Check licenses`, () => {
        const licenses = p.licenses;

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
        const mostDeps = p.mostDependencies;

        expect(mostDeps.name).toBe("react");
        expect(mostDeps.version).toBe("16.8.6");
        expect(mostDeps.directDependencyCount).toBe(4);
    });

    test(`Checks package that is most referred`, () => {
        const [name, times] = p.mostReferred;

        expect(name).toBe("loose-envify");
        expect(times).toBe(3);
    });

    test(`Checks for package with most versions`, async () => {
        const rootPath = path.join("tests", "data", "testproject2");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageJson(rootPath), provider, new OraLogger());
        const p: Package = await visitor.visit();

        for (const [name, versions] of p.mostVersions) {
            expect(name).toBe("kind-of");

            expect(versions.has("3.2.2")).toBe(true);
            expect(versions.has("4.0.0")).toBe(true);
            expect(versions.has("5.1.0")).toBe(true);
            expect(versions.has("6.0.2")).toBe(true);
        }
    });

    test(`Checks for package with most versions (all equal)`, () => {
        const mostVersions = p.mostVersions;

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
        const cost = p.cost;

        expect(cost).toBe(0);
    });

    test(`Checks path string`, () => {
        const react = p.getPackageByName("react");

        expect.assertions(1);
        if (react) {
            const path = react.pathString;

            expect(path).toBe(`testproject1@1.0.0 → react@16.8.6`);
        }
    });

    test(`Check path for root`, () => {
        const path = p.path;
        const [[name, version]] = path;

        expect(path.length).toBe(1);
        expect(name).toBe("testproject1");
        expect(version).toBe("1.0.0");
    });

    test(`Check path for specific package`, () => {
        const pa2 = p.getPackageByName("loose-envify", "1.4.0");

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
        expect(p.all.length).toBe(14);
    });

    test(`Check loops`, () => {
        expect(p.loops.length).toBe(0);
    });

    test(`Checks published`, () => {
        expect(p.published).toBe(undefined);
    });

    test(`Checks timeSpan`, () => {
        expect(() => p.timeSpan).toThrow();
    });

    test(`Checks size`, () => {
        expect(() => p.size).toThrow();
    });

    test(`Print dependency tree in console`, () => {
        const stdout = new TestWritable();
        const formatter = new Formatter(stdout);

        p.printDependencyTree(formatter);
        expect(stdout.lines.length).toEqual(14);
    });

    test(`Deprecation flag`, () => {
        const { deprecated, message } = p.deprecatedInfo;

        expect(deprecated).toBe(false);
        expect(typeof message).toBe("string");
    });
});

describe(`Deprecated Package Tests`, () => {
    test(`Deprecation flag`, async () => {
        const rootPath = path.join("tests", "data", "deprecated");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageJson(rootPath), provider, new OraLogger());
        const p = await visitor.visit();
        const extnode = p.getPackageByName("extnode");

        if (extnode) {
            const { deprecated, message } = extnode.deprecatedInfo;

            expect(deprecated).toBe(true);
            expect(typeof message).toBe("string");
        } else {
            fail(`Couldn't find package "extnode"`);
        }
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

    test(`Fails to parse, throws forr foo@`, () => {
        expect(() => getNameAndVersion(`foo@`)).toThrow();
    });
});

export class TestWritable extends Writable {
    public lines: string[] = [];

    _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        const data: string = chunk.toString();

        if (data.endsWith(`\n`)) this.lines.push(data.slice(0, data.length - 1));
        else this.lines.push(data);

        callback();
    }
}
