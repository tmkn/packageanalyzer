import * as path from "path";

import { Package } from "../src/package/package";
import { printDependencyTree } from "../src/extensions/metrics/LoopMetrics";
import { Formatter } from "../src/utils/formatter";
import { OraLogger } from "../src/utils/logger";
import { FileSystemPackageProvider } from "../src/providers/folder";
import { getPackageVersionFromPackageJson, Visitor } from "../src/visitors/visitor";
import { TestWritable } from "./common";

describe(`Metrics Extension Tests`, () => {
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

    test(`Print dependency tree in console`, () => {
        const stdout = new TestWritable();
        const formatter = new Formatter(stdout);

        printDependencyTree(p, formatter);
        expect(stdout.lines.length).toEqual(14);
    });
});
