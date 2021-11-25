"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const folder_1 = require("../src/providers/folder");
const visitor_1 = require("../src/visitors/visitor");
const logger_1 = require("../src/utils/logger");
const tree_1 = require("../src/utils/tree");
const formatter_1 = require("../src/utils/formatter");
const common_1 = require("./common");
const DependencyUtilities_1 = require("../src/extensions/utilities/DependencyUtilities");
const LicenseUtilities_1 = require("../src/extensions/utilities/LicenseUtilities");
const utils_1 = require("../src/visitors/utils");
describe(`Tree Tests`, () => {
    test(`Print tree`, async () => {
        const rootPath = path.join("tests", "data", "testproject1");
        const provider = new folder_1.FileSystemPackageProvider(rootPath);
        const visitor = new visitor_1.Visitor((0, utils_1.getPackageVersionFromPackageJson)(rootPath), provider, new logger_1.OraLogger());
        const p = await visitor.visit();
        const converter = {
            getLabel: data => data.fullName,
            getChildren: data => data.directDependencies
        };
        const stdout = new common_1.TestWritable();
        const formatter = new formatter_1.Formatter(stdout);
        (0, tree_1.print)(p, converter, formatter);
        expect(stdout.lines).toMatchSnapshot();
    });
    test(`Print tree with multi lines`, async () => {
        const rootPath = path.join("tests", "data", "testproject1");
        const provider = new folder_1.FileSystemPackageProvider(rootPath);
        const visitor = new visitor_1.Visitor((0, utils_1.getPackageVersionFromPackageJson)(rootPath), provider, new logger_1.OraLogger());
        const p = await visitor.visit();
        const converter = {
            getLabel: data => [
                `${data.fullName} (${new DependencyUtilities_1.DependencyUtilities(data).transitiveCount} dependencies)`,
                `License: ${new LicenseUtilities_1.LicenseUtilities(data).license}`
            ],
            getChildren: data => data.directDependencies
        };
        const stdout = new common_1.TestWritable();
        const formatter = new formatter_1.Formatter(stdout);
        (0, tree_1.print)(p, converter, formatter);
        expect(stdout.lines).toMatchSnapshot();
    });
});
//# sourceMappingURL=tree.test.js.map