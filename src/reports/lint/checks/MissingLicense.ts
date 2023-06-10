import { IPackage } from "../../../package/package";
import { ILintCheck } from "../LintRule";

export const MissingLicense: ILintCheck = {
    name: "missing-license",
    check: (pkg: IPackage) => {
        const hasLicense = pkg.getData("license") ?? pkg.getData("licenses");

        if (!hasLicense) {
            return `missing license`;
        }
    }
};
