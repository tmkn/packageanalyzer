import { describe, test, expect } from "vitest";
import * as path from "path";

import { FileSystemPackageProvider } from "../src/providers/folder.js";
import { Visitor } from "../../shared/src/visitors/visitor.js";
import { OraLogger } from "../src/loggers/OraLogger.js";
import { type ITreeFormatter, print } from "../src/utils/tree.js";
import { type IPackage } from "../../shared/src/package/package.js";
import { Formatter } from "../../shared/src/utils/formatter.js";
import { createMockContext } from "../../test-utils/src/common.js";
import { DependencyUtilities } from "../src/extensions/utilities/DependencyUtilities.js";
import { LicenseUtilities } from "../src/extensions/utilities/LicenseUtilities.js";
import { getPackageVersionFromPath } from "../src/visitors/util.node.js";
import { NodeWriter } from "../src/host/NodeHost.js";

describe(`Tree Tests`, () => {
    test(`Print tree`, async () => {
        const rootPath = path.join("packages", "node", "tests", "data", "testproject1");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageVersionFromPath(rootPath), provider, new OraLogger());
        const p = await visitor.visit();

        const converter: ITreeFormatter<IPackage> = {
            getLabel: data => data.fullName,
            getChildren: data => data.directDependencies
        };

        const { stdout } = createMockContext();
        const nodeWriter = new NodeWriter(stdout);
        const formatter = new Formatter(nodeWriter);

        print(p, converter, formatter);
        await nodeWriter.flush();

        expect(stdout.lines).toMatchSnapshot();
    });

    test(`Print tree with multi lines`, async () => {
        const rootPath = path.join("packages", "node", "tests", "data", "testproject1");
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
        const nodeWriter = new NodeWriter(stdout);
        const formatter = new Formatter(nodeWriter);

        print(p, converter, formatter);
        await nodeWriter.flush();

        expect(stdout.lines).toMatchSnapshot();
    });
});
