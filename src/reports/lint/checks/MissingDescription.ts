import { type IPackage } from "../../../package/package.js";
import { type ILintCheck } from "../LintRule.js";

export const MissingDescription: ILintCheck = {
    name: "missing-description",
    check: (pkg: IPackage) => {
        const hasDescription = pkg.getData("description");

        if (!hasDescription) {
            return `missing a description`;
        }
    }
};
