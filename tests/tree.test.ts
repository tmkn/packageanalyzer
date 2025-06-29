import * as path from "path";

import { FileSystemPackageProvider } from "../src/providers/folder.js";
import { Visitor } from "../src/visitors/visitor.js";
import { OraLogger } from "../src/loggers/OraLogger.js";
import { type ITreeFormatter, print } from "../src/utils/tree.js";
import { type IPackage } from "../src/package/package.js";
import { Formatter } from "../src/utils/formatter.js";
import { createMockContext } from "./common.js";
import { DependencyUtilities } from "../src/extensions/utilities/DependencyUtilities.js";
import { LicenseUtilities } from "../src/extensions/utilities/LicenseUtilities.js";
import { getPackageVersionFromPath } from "../src/visitors/util.node.js";

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
