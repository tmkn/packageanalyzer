import { createRule } from "../src/reports/lint/LintRule";
import { MissingFields } from "../src/reports/lint/checks/MissingFields";
import { MissingLicense } from "../src/reports/lint/checks/MissingLicense";
import { NoScripts } from "../src/reports/lint/checks/NoScripts";
import { NonRegistryDependency } from "../src/reports/lint/checks/NonRegistryDependency";

module.exports = {
    rules: [
        createRule("error", NoScripts),
        // createRule("error", MaintainerCheck, { authors: ["sindresorhus"] }),
        createRule("error", new MissingFields(), { fields: [`description`, `repository`] }),
        // ["error", new OSILicenseCheck()],
        ["warning", NonRegistryDependency],
        // ["warning", MissingDescription, undefined],
        ["warning", MissingLicense, undefined]
    ]
};
