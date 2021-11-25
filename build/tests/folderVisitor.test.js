"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const folder_1 = require("../src/providers/folder");
const visitor_1 = require("../src/visitors/visitor");
const logger_1 = require("../src/utils/logger");
const LoopUtilities_1 = require("../src/extensions/utilities/LoopUtilities");
const LicenseUtilities_1 = require("../src/extensions/utilities/LicenseUtilities");
const utils_1 = require("../src/visitors/utils");
describe(`visitFromFolder Tests`, () => {
    let p;
    beforeAll(async () => {
        const rootPath = path.join("tests", "data", "testproject2");
        const provider = new folder_1.FileSystemPackageProvider(rootPath);
        const visitor = new visitor_1.Visitor((0, utils_1.getPackageVersionFromPackageJson)(rootPath), provider, new logger_1.OraLogger());
        p = await visitor.visit();
    });
    test(`Checks name`, () => {
        expect(`testproject2`).toBe(p.name);
    });
    test(`Checks version`, () => {
        expect(`1.0.0`).toBe(p.version);
    });
    test(`Checks fullName`, () => {
        expect(`${p.name}@${p.version}`).toBe(p.fullName);
    });
    test(`Checks license`, () => {
        expect(`ISC`).toBe(new LicenseUtilities_1.LicenseUtilities(p).license);
    });
    test(`Throws on missing package.json`, async () => {
        expect.assertions(1);
        try {
            const rootPath = `folderdoesntexist`;
            const provider = new folder_1.FileSystemPackageProvider(rootPath);
            const visitor = new visitor_1.Visitor((0, utils_1.getPackageVersionFromPackageJson)(rootPath), provider, new logger_1.OraLogger());
            await visitor.visit();
        }
        catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
    test(`Check loops`, () => {
        expect(new LoopUtilities_1.LoopUtilities(p).loops.length).toBe(50);
    });
    test(`Check direct dependecies`, async () => {
        const dependencies = p.directDependencies;
        expect(dependencies.length).toEqual(1);
        expect(dependencies[0].fullName).toEqual(`webpack@4.35.2`);
        const webpackDependencies = dependencies[0].directDependencies;
        expect(webpackDependencies.length).toEqual(24);
    });
    test(`Check loopPathMap`, () => {
        const expected = [
            "@webassemblyjs/ast",
            "@webassemblyjs/wast-parser",
            "@webassemblyjs/helper-module-context",
            "@webassemblyjs/wast-printer"
        ];
        expect([...new LoopUtilities_1.LoopUtilities(p).loopPathMap.keys()].sort()).toEqual(expected.sort());
    });
    test(`Check distinct loop count`, () => {
        expect(new LoopUtilities_1.LoopUtilities(p).distinctLoopCount).toBe(8);
    });
    test(`Check loopPathString`, () => {
        const { loopPathMap } = new LoopUtilities_1.LoopUtilities(p);
        const [pkgName] = [...new LoopUtilities_1.LoopUtilities(p).loopPathMap.keys()];
        const [loopPath] = [...(loopPathMap.get(pkgName) ?? new Set())].sort();
        const expectedLoopPath = "@webassemblyjs/ast@1.8.5 → @webassemblyjs/helper-module-context@1.8.5 → @webassemblyjs/ast@1.8.5";
        expect(loopPath).toEqual(expectedLoopPath);
    });
});
describe(`visitFromName Error Handling`, () => {
    class CustomError extends Error {
        constructor(msg) {
            super(msg);
        }
    }
    class MockProvider {
        constructor() {
            this.size = 0;
        }
        getPackageJson(name /* eslint-disable-line */, version /* eslint-disable-line */) {
            throw new CustomError(`getPackageByVersion not implemented`);
        }
        getPackageJsons(modules /* eslint-disable-line */) {
            throw new Error(`getPackagesByVersion not implemented`);
        }
    }
    test(`Correctly propagates an exception`, async () => {
        expect.assertions(1);
        try {
            const visitor = new visitor_1.Visitor(["wurscht"], new MockProvider(), new logger_1.OraLogger());
            await visitor.visit();
        }
        catch (e) {
            expect(e).toBeInstanceOf(CustomError);
        }
    });
});
//# sourceMappingURL=folderVisitor.test.js.map