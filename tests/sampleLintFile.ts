import { satisfies } from "semver";
import * as dayjs from "dayjs";

import { Package, npmOnline } from "../src";
import { createRule } from "../src/reports/lint/LintRule";
import { MissingFields } from "../src/reports/lint/checks/MissingFields";
import { MissingLicense } from "../src/reports/lint/checks/MissingLicense";
import { NoScripts } from "../src/reports/lint/checks/NoScripts";
import { NonRegistryDependency } from "../src/reports/lint/checks/NonRegistryDependency";
import { ValidateKey } from "../src/reports/lint/checks/ValidateKey";
import { ILintFile } from "../src/reports/LintReport";
import { TarDecorator } from "../src/extensions/decorators/TarDecorator";

module.exports = {
    rules: [
        // @ts-ignore
        // createRule("error", new ValidateKey(), "description"),
        // @ts-ignore
        // createRule("error", new ValidateKey(), "foobar"),
        // createRule("error", validateKey, {
        //     key: "description",
        //     validator: (value: unknown) => typeof value === "string" && value.length === 0,
        //     message: "description is not empty"
        // })
        // createRule("error", NoScripts),
        // createRule("error", MaintainerCheck, { authors: ["sindresorhus"] }),
        // createRule("error", new MissingFields(), { fields: [`description`, `repository`] }),
        // ["error", new OSILicenseCheck()],
        // ["warning", NonRegistryDependency],
        // ["warning", MissingDescription, undefined],
        // ["warning", MissingLicense, undefined],
        [
            "error",
            {
                name: "no-old-package",
                check(pkg: Package, maxYear: string) {
                    const tarBall = pkg.getDecoratorData("tarBall") as any;
                    const manifest = pkg.getDecoratorData("manifest") as any;
                    // @ts-ignore
                    const createdStr = manifest.time[pkg.version];

                    const timestamp = dayjs(createdStr);
                    const currentDate = dayjs();
                    const elapsedDays = currentDate.diff(timestamp, "day");

                    if (elapsedDays > 365 * parseInt(maxYear)) {
                        return `Package is more than ${maxYear} years old (${elapsedDays} days old) (${tarBall.files.size} files)`;
                    }
                },
                decorators: {
                    manifest: {
                        name: "manifest",
                        key: "manifest",
                        apply: ({ p }) => npmOnline.getPackageMetadata(p.name)
                    },
                    tarBall: new TarDecorator()
                }
            },
            3
        ]
    ]
} satisfies ILintFile;
