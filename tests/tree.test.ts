import * as path from "path";

import { FileSystemPackageProvider } from "../src/providers/folder";
import { Visitor } from "../src/visitors/visitor";
import { OraLogger } from "../src/loggers/OraLogger";
import { ITreeFormatter, print } from "../src/utils/tree";
import { IPackage } from "../src/package/package";
import { Formatter } from "../src/utils/formatter";
import { createMockContext } from "./common";
import { DependencyUtilities } from "../src/extensions/utilities/DependencyUtilities";
import { LicenseUtilities } from "../src/extensions/utilities/LicenseUtilities";
import { getPackageVersionFromPath } from "../src/visitors/util.node";

describe(`Tree Tests`, () => {
    test(`Print tree`, async () => {
        const rootPath = path.join("tests", "data", "testproject1");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageVersionFromPath(rootPath), provider, new OraLogger());
        const p = await visitor.visit();

        const converter: ITreeFormatter<IPackage> = {
            getLabel: data => data.fullName,
            getChildren: data => data.directDependencies
        };

        const { stdout } = createMockContext();
        const formatter = new Formatter(stdout);

        print(p, converter, formatter);

        expect(stdout.lines).toMatchSnapshot();
    });

    test(`Print tree with multi lines`, async () => {
        const rootPath = path.join("tests", "data", "testproject1");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageVersionFromPath(rootPath), provider, new OraLogger());
        const p = await visitor.visit();

        const converter: ITreeFormatter<IPackage> = {
            getLabel: data => [
                `${data.fullName} (${new DependencyUtilities(data).transitiveCount} dependencies)`,
                `License: ${new LicenseUtilities(data).license}`
            ],
            getChildren: data => data.directDependencies
        };

        const { stdout } = createMockContext();
        const formatter = new Formatter(stdout);

        print(p, converter, formatter);

        expect(stdout.lines).toMatchSnapshot();
    });
});
