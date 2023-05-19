import { Package } from "../../../package/package";
import { ILintCheck } from "../LintRule";

export const MissingDescription: ILintCheck = {
    name: "missing-description",
    check: (pkg: Package) => {
        const hasDescription = pkg.getData("description");

        if (!hasDescription) {
            return `missing a description`;
        }
    }
};
