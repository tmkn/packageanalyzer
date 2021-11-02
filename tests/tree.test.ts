import * as path from "path";

import { FileSystemPackageProvider } from "../src/providers/folder";
import { getPackageVersionFromPackageJson, Visitor } from "../src/visitors/visitor";
import { OraLogger } from "../src/utils/logger";
import { ITreeFormatter, print } from "../src/utils/tree";
import { Package } from "../src/package/package";
import { Formatter } from "../src/utils/formatter";
import { TestWritable } from "./common";
import { DependencyUtilities } from "../src/extensions/utilities/DependencyUtilities";
import { LicenseUtilities } from "../src/extensions/utilities/LicenseUtilities";

describe(`Tree Tests`, () => {
    test(`Print tree`, async () => {
        const rootPath = path.join("tests", "data", "testproject1");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(
            getPackageVersionFromPackageJson(rootPath),
            provider,
            new OraLogger()
        );
        const p = await visitor.visit();

        const converter: ITreeFormatter<Package> = {
            getLabel: data => data.fullName,
            getChildren: data => data.directDependencies
        };

        const stdout = new TestWritable();
        const formatter = new Formatter(stdout);

        print<Package>(p, converter, formatter);

        expect(stdout.lines).toMatchSnapshot();
    });

    test(`Print tree with multi lines`, async () => {
        const rootPath = path.join("tests", "data", "testproject1");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(
            getPackageVersionFromPackageJson(rootPath),
            provider,
            new OraLogger()
        );
        const p = await visitor.visit();

        const converter: ITreeFormatter<Package> = {
            getLabel: data => [
                `${data.fullName} (${new DependencyUtilities(data).transitiveCount} dependencies)`,
                `License: ${new LicenseUtilities(data).license}`
            ],
            getChildren: data => data.directDependencies
        };

        const stdout = new TestWritable();
        const formatter = new Formatter(stdout);

        print<Package>(p, converter, formatter);

        expect(stdout.lines).toMatchSnapshot();
    });
});
