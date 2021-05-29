import * as path from "path";

import { Package } from "../src/package/package";
import { FileSystemPackageProvider } from "../src/providers/folder";
import {
    getPackageVersionFromPackageJson,
    Visitor
} from "../src/visitors/visitor";
import { OraLogger } from "../src/utils/logger";
import { DependencyMetrics } from "../src/extensions/metrics/DependencyMetrics";

describe(`Dependency Metrics Tests`, () => {
    let p: Package;

    beforeAll(async () => {
        const rootPath = path.join("tests", "data", "testproject1");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(
            getPackageVersionFromPackageJson(rootPath),
            provider,
            new OraLogger()
        );

        p = await visitor.visit();
    });

    test(`Checks package with most direct dependencies`, () => {
        const [mostDeps] = new DependencyMetrics(p).mostDirectDependencies;

        expect(mostDeps.name).toBe("react");
        expect(mostDeps.version).toBe("16.8.6");
        expect(mostDeps.directDependencies.length).toBe(4);
    });

    test(`Checks package that is most referred`, () => {
        const [name, times] = new DependencyMetrics(p).mostReferred;

        expect(name).toBe("loose-envify");
        expect(times).toBe(3);
    });

    test(`Checks for package with most versions`, async () => {
        const rootPath = path.join("tests", "data", "testproject2");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(
            getPackageVersionFromPackageJson(rootPath),
            provider,
            new OraLogger()
        );
        const p: Package = await visitor.visit();

        for (const [name, versions] of new DependencyMetrics(p).mostVersions) {
            expect(name).toBe("kind-of");

            expect(versions.has("3.2.2")).toBe(true);
            expect(versions.has("4.0.0")).toBe(true);
            expect(versions.has("5.1.0")).toBe(true);
            expect(versions.has("6.0.2")).toBe(true);
        }
    });

    test(`Checks for package with most versions (all equal)`, () => {
        const mostVersions = new DependencyMetrics(p).withSelf.mostVersions;

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

    test(`Check all`, () => {
        expect(new DependencyMetrics(p).withSelf.all.length).toBe(14);
    });

    test(`Check distinct`, () => {
        expect(new DependencyMetrics(p).withSelf.distinctNames.size).toBe(8);
    });
});