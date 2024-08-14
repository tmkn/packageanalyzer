/* eslint-disable */

import { IAttachment } from "../src";
import { IApplyArgs } from "../src/attachments/Attachments";
import { getDownloadsLastWeek } from "../src/reports/DownloadCountReport";
import { createRule, createRuleWithAttachment } from "../src/reports/lint/LintRule";
import { MissingFields } from "../src/reports/lint/checks/MissingFields";
import { MissingLicense } from "../src/reports/lint/checks/MissingLicense";
import { NoScripts } from "../src/reports/lint/checks/NoScripts";
import { NonRegistryDependency } from "../src/reports/lint/checks/NonRegistryDependency";
import { ValidateKey } from "../src/reports/lint/checks/ValidateKey";

class DownloadCount implements IAttachment<"count", number> {
    readonly key = "count";
    readonly name = "Download Count";
    async apply(args: IApplyArgs) {
        const data = await getDownloadsLastWeek(args.p.name);

        return data.downloads;
    }
}

module.exports = {
    rules: [
        createRule("error", new ValidateKey(), "description"),
        createRule("error", new ValidateKey(), "foobar")
        // createRuleWithAttachment("error", {
        //     name: "some-check",
        //     check: (pkg, params) => {
        //         const _params: undefined = params;
        //         const data: number = pkg.getAttachmentData("count");

        //         return `Download count: ${data}`;
        //     },
        //     attachments: [new DownloadCount()]
        // })
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
