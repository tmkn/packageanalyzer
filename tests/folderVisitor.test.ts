import * as path from "path";

import { Package } from "../src/analyzers/package";
import { getPackageJson } from "../src/visitors/folder";
import { IPackageVersionProvider, FileSystemPackageProvider } from "../src/providers/folder";
import { INpmPackageVersion } from "../src/npm";
import { Visitor } from "../src/visitors/visitor";
import { OraLogger } from "../src/logger";
import { LoopStatistics } from "../src/extensions/statistics/StatisticsExtension";

describe(`visitFromFolder Tests`, () => {
    let p: Package;

    beforeAll(async () => {
        const rootPath = path.join("tests", "data", "testproject2");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageJson(rootPath), provider, new OraLogger());

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
        expect(`ISC`).toBe(p.license);
    });

    test(`Throws on missing package.json`, async () => {
        expect.assertions(1);

        try {
            const rootPath = `folderdoesntexist`;
            const provider = new FileSystemPackageProvider(rootPath);
            const visitor = new Visitor(getPackageJson(rootPath), provider, new OraLogger());

            await visitor.visit();
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });

    test(`Check loops`, () => {
        expect(new LoopStatistics(p).loops.length).toBe(50);
    });

    test(`Check direct dependecies`, async () => {
        const dependencies = p.directDependencies;

        expect(dependencies.length).toEqual(1);
        expect(dependencies[0].fullName).toEqual(`webpack@4.35.2`);

        const webpackDependencies = dependencies[0].directDependencies;

        expect(webpackDependencies.length).toEqual(24);
    });

    test(`Check loopPathMap`, () => {
        const expected: string[] = [
            "@webassemblyjs/ast",
            "@webassemblyjs/wast-parser",
            "@webassemblyjs/helper-module-context",
            "@webassemblyjs/wast-printer"
        ];

        expect([...new LoopStatistics(p).loopPathMap.keys()].sort()).toEqual(expected.sort());
    });

    test(`Check distinct loop count`, () => {
        expect(new LoopStatistics(p).distinctLoopCount).toBe(8);
    });

    test(`Check loopPathString`, () => {
        const { loopPathMap } = new LoopStatistics(p);
        const [pkgName] = [...new LoopStatistics(p).loopPathMap.keys()];
        const [loopPath] = [...(loopPathMap.get(pkgName) ?? new Set())].sort();
        const expectedLoopPath =
            "@webassemblyjs/ast@1.8.5 → @webassemblyjs/helper-module-context@1.8.5 → @webassemblyjs/ast@1.8.5";

        expect(loopPath).toEqual(expectedLoopPath);
    });
});

describe(`visitFromName Error Handling`, () => {
    class CustomError extends Error {
        constructor(msg: string) {
            super(msg);
        }
    }

    class MockProvider implements IPackageVersionProvider {
        size = 0;

        getPackageByVersion(
            name: string /* eslint-disable-line */,
            version?: string | undefined /* eslint-disable-line */
        ): Promise<INpmPackageVersion> {
            throw new CustomError(`getPackageByVersion not implemented`);
        }

        getPackagesByVersion(
            modules: [string, string?][] /* eslint-disable-line */
        ): AsyncIterableIterator<INpmPackageVersion> {
            throw new Error(`getPackagesByVersion not implemented`);
        }
    }

    test(`Correctly propagates an exception`, async () => {
        expect.assertions(1);

        try {
            const visitor = new Visitor(["wurscht"], new MockProvider(), new OraLogger());
            await visitor.visit();
        } catch (e) {
            expect(e).toBeInstanceOf(CustomError);
        }
    });
});
