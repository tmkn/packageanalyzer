import { isValidDependencyType } from "../../src/cli/common";

describe(`CLI Utility`, () => {
    test(`isValidDependencyType`, () => {
        expect(isValidDependencyType("dependencies")).toEqual(true);
        expect(isValidDependencyType("devDependencies")).toEqual(true);
        expect(isValidDependencyType("abc")).toEqual(false);
        expect(isValidDependencyType(3)).toEqual(false);
    });
});
