import { IPackage } from "../../../package/package";
import { ILintCheck } from "../LintRule";

export const NoScripts: ILintCheck = {
    name: "no-scripts",
    check: (pkg: IPackage) => {
        const hasPostInstall = pkg.getData("scripts.postinstall");
        const hasPreInstall = pkg.getData("scripts.preinstall");

        if (hasPostInstall && hasPreInstall) {
            return `detected a postinstall and a preinstall scripts`;
        } else if (hasPostInstall) {
            return `detected a postinstall script`;
        } else if (hasPreInstall) {
            return `detected a preinstall script`;
        }
    }
};
