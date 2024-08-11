/* eslint-disable */

import { createRule } from "../src/reports/lint/LintRule";
import { MissingFields } from "../src/reports/lint/checks/MissingFields";
import { MissingLicense } from "../src/reports/lint/checks/MissingLicense";
import { NoScripts } from "../src/reports/lint/checks/NoScripts";
import { NonRegistryDependency } from "../src/reports/lint/checks/NonRegistryDependency";
import { ValidateKey } from "../src/reports/lint/checks/ValidateKey";

module.exports = {
    rules: [
        // @ts-ignore
        createRule("error", new ValidateKey(), {
            key: "description"
        }),
        // @ts-ignore
        createRule("error", new ValidateKey(), {
            key: "foobar"
        })
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
        // ["warning", MissingLicense, undefined]
    ]
};
