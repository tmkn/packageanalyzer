"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const folder_1 = require("../src/providers/folder");
const visitor_1 = require("../src/visitors/visitor");
const logger_1 = require("../src/utils/logger");
const map_1 = require("../src/utils/map");
const utils_1 = require("../src/visitors/utils");
describe(`Map tests`, () => {
    let p;
    let mapped;
    beforeAll(async () => {
        const rootPath = path.join("tests", "data", "testproject2");
        const provider = new folder_1.FileSystemPackageProvider(rootPath);
        const visitor = new visitor_1.Visitor((0, utils_1.getPackageVersionFromPackageJson)(rootPath), provider, new logger_1.OraLogger());
        p = await visitor.visit();
        mapped = (0, map_1.map)(p, p => ({ foo: p.fullName }));
    });
    test(`Correctly maps Package`, () => {
        expect(p.fullName).toEqual(mapped.foo);
    });
    test(`Correctly sets dependencis`, () => {
        expect(mapped.dependencies.length).toEqual(1);
    });
    test(`Correctly sets parent`, () => {
        const checkParent = (current, parent) => {
            expect(current.parent === parent).toEqual(true);
            for (const child of current.dependencies) {
                checkParent(child, current);
            }
        };
        checkParent(mapped, null);
    });
});
//# sourceMappingURL=map.test.js.map