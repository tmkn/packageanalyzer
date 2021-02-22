import * as path from "path";

import { Package } from "../src/analyzers/package";
import { printDependencyTree } from "../src/extensions/statistics/LoopStatistics";
import { Formatter } from "../src/formatter";
import { OraLogger } from "../src/logger";
import { FileSystemPackageProvider } from "../src/providers/folder";
import { getPackageJson } from "../src/visitors/folder";
import { Visitor } from "../src/visitors/visitor";
import { TestWritable } from "./common";

describe(`Statistics Extension Tests`, () => {
    let p: Package;

    beforeAll(async () => {
        const rootPath = path.join("tests", "data", "testproject1");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageJson(rootPath), provider, new OraLogger());

        p = await visitor.visit();
    });

    test(`Print dependency tree in console`, () => {
        const stdout = new TestWritable();
        const formatter = new Formatter(stdout);

        printDependencyTree(p, formatter);
        expect(stdout.lines.length).toEqual(14);
    });
});