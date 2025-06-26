import { type IPackage } from "../../../package/package.js";
import { type ILintCheck } from "../LintRule.js";

export class OSILicenseCheck implements ILintCheck {
    name = "has-osi-license";
    check(pkg: IPackage) {
        const license = pkg.getData("license");
        if (license) {
            if (typeof license === "string") {
                if (!OSILicenseCheck.osiLicenses.includes(license)) {
                    return `license ${license} is not an OSI license`;
                }
            } else if (Array.isArray(license)) {
                const invalidLicenses = license.filter(
                    license => !OSILicenseCheck.osiLicenses.includes(license)
                );
                if (invalidLicenses.length > 0) {
                    return `license ${invalidLicenses.join(", ")} is not an OSI license`;
                }
            }
        }
    }

    private static osiLicenses: string[] = [
        "BSD-1-Clause",
        "AFL-3.0",
        "APL-1.0",
        "Apache-2.0",
        "CDDL-1.0",
        "CDDL-1.0",
        "CPL-1.0",
        "CATOSL-1.1",
        "CAL-1.0",
        "EPL-2.0",
        "eCos-2.0",
        "ECL-2.0",
        "AGPL-3.0-only",
        "GPL-2.0",
        "GPL-3.0-only",
        "LGPL-2.1",
        "LGPL-3.0-only",
        "LGPL-2.0-only",
        "MIT-0",
        "MPL-2.0",
        "MulanPSL-2.0",
        "OLFL-1.3",
        "OLDAP-2.8",
        "PHP-3.01",
        "BSD-2-Clause",
        "BSD-3-Clause",
        "MIT",
        "QPL-1.0",
        "Unlicense"
    ];
}
