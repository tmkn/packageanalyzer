import { IPackage } from "../../../package/package";
import { ILintCheck } from "../LintRule";

export const MissingDescription: ILintCheck = {
    name: "missing-description",
    check: (pkg: IPackage) => {
        const hasDescription = pkg.getData("description");

        if (!hasDescription) {
            return `missing a description`;
        }
    }
};
