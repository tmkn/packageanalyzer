import { type IPackage } from "../../../../../shared/src/package/package.js";
import { type ILintCheck } from "../LintRule.js";

export const MissingLicense: ILintCheck = {
    name: "missing-license",
    check: (pkg: IPackage) => {
        const hasLicense = pkg.getData("license") ?? pkg.getData("licenses");

        if (!hasLicense) {
            return `missing license`;
        }
    }
};
