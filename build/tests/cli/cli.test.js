"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../../src/cli/common");
describe(`CLI Utility`, () => {
    test(`isValidDependencyType`, () => {
        expect((0, common_1.isValidDependencyType)("dependencies")).toEqual(true);
        expect((0, common_1.isValidDependencyType)("devDependencies")).toEqual(true);
        expect((0, common_1.isValidDependencyType)("abc")).toEqual(false);
        expect((0, common_1.isValidDependencyType)(3)).toEqual(false);
    });
});
//# sourceMappingURL=cli.test.js.map