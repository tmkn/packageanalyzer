 

import { type AttachmentFn } from "../src/index.js";
import { type IApplyArgs } from "../src/attachments/Attachments.js";
import { getDownloadsLastWeek } from "../src/reports/DownloadCountReport.js";
import { createRule, createRuleWithAttachment } from "../src/reports/lint/LintRule.js";
import { MissingFields } from "../src/reports/lint/checks/MissingFields.js";
import { MissingLicense } from "../src/reports/lint/checks/MissingLicense.js";
import { NoScripts } from "../src/reports/lint/checks/NoScripts.js";
import { NonRegistryDependency } from "../src/reports/lint/checks/NonRegistryDependency.js";
import { ValidateKey } from "../src/reports/lint/checks/ValidateKey.js";

class DownloadCount {
    readonly key = "count";
    readonly name = "Download Count";
    async apply(args: IApplyArgs) {
        const data = await getDownloadsLastWeek(args.p.name);

        return data.downloads;
    }
}

const foo = {
    rules: [
        createRule("error", new ValidateKey(), "foo"),
        createRule("error", new ValidateKey(), "bar")
        // createRuleWithAttachment("error", {
        //     name: "some-check",
        //     check: (pkg, params) => {
        //         const _params: undefined = params;
        //         const data: number = pkg.getAttachmentData("count");

        //         return `Download count: ${Number(data).toLocaleString()}`;
        //     },
        //     attachments: { count: new DownloadCount().apply }
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

export default foo;
