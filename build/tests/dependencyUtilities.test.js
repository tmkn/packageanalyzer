"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const folder_1 = require("../src/providers/folder");
const visitor_1 = require("../src/visitors/visitor");
const logger_1 = require("../src/utils/logger");
const DependencyUtilities_1 = require("../src/extensions/utilities/DependencyUtilities");
const utils_1 = require("../src/visitors/utils");
describe(`Dependency Utilities Tests`, () => {
    let p;
    beforeAll(async () => {
        const rootPath = path.join("tests", "data", "testproject1");
        const provider = new folder_1.FileSystemPackageProvider(rootPath);
        const visitor = new visitor_1.Visitor((0, utils_1.getPackageVersionFromPackageJson)(rootPath), provider, new logger_1.OraLogger());
        p = await visitor.visit();
    });
    test(`Checks package with most direct dependencies`, () => {
        const [mostDeps] = new DependencyUtilities_1.DependencyUtilities(p).mostDirectDependencies;
        expect(mostDeps.name).toBe("react");
        expect(mostDeps.version).toBe("16.8.6");
        expect(mostDeps.directDependencies.length).toBe(4);
    });
    test(`Checks package that is most referred`, () => {
        const { pkgs, count } = new DependencyUtilities_1.DependencyUtilities(p).mostReferred;
        expect(pkgs[0]).toBe("loose-envify");
        expect(count).toBe(3);
    });
    test(`Checks for package with most versions`, async () => {
        const rootPath = path.join("tests", "data", "testproject2");
        const provider = new folder_1.FileSystemPackageProvider(rootPath);
        const visitor = new visitor_1.Visitor((0, utils_1.getPackageVersionFromPackageJson)(rootPath), provider, new logger_1.OraLogger());
        const p = await visitor.visit();
        for (const [name, versions] of new DependencyUtilities_1.DependencyUtilities(p).mostVersions) {
            expect(name).toBe("kind-of");
            expect(versions.has("3.2.2")).toBe(true);
            expect(versions.has("4.0.0")).toBe(true);
            expect(versions.has("5.1.0")).toBe(true);
            expect(versions.has("6.0.2")).toBe(true);
        }
    });
    test(`Checks for package with most versions (all equal)`, () => {
        const mostVersions = new DependencyUtilities_1.DependencyUtilities(p).withSelf.mostVersions;
        expect(mostVersions.size).toBe(8);
        const names = [
            "testproject1",
            "react",
            "loose-envify",
            "js-tokens",
            "object-assign",
            "prop-types",
            "react-is",
            "scheduler"
        ];
        const _versions = [
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
        expect(new DependencyUtilities_1.DependencyUtilities(p).withSelf.all.length).toBe(14);
    });
    test(`Check distinct`, () => {
        expect(new DependencyUtilities_1.DependencyUtilities(p).withSelf.distinctNames.size).toBe(8);
    });
});
//# sourceMappingURL=dependencyUtilities.test.js.map