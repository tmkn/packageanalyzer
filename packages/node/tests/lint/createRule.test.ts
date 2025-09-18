import { describe, test, expect } from "vitest";

import type {
    IApplyArgs,
    AttachmentFn,
    Attachments
} from "../../../shared/src/attachments/Attachments.js";
import { LintReport } from "../../src/reports/lint/LintReport.js";
import {
    createRule,
    createRuleWithAttachment,
    type ILintCheck,
    type ILintFile
} from "../../src/reports/lint/LintRule.js";
import {
    createReportServiceFactory,
    type ReportServiceContext
} from "../../../test-utils/src/common.js";
import type { IMockPackageJson } from "../../../test-utils/src/mocks.js";

describe(`createRule tests`, () => {
    const mockAttachment: AttachmentFn<number> = async (args: IApplyArgs) => {
        return 3;
    };

    function setupLintService(rules: ILintFile["rules"]): ReportServiceContext<LintReport> {
        const medalloPkg: IMockPackageJson = {
            name: `medallo`,
            version: `1.0.0`
        };

        const buildLintReport = createReportServiceFactory(LintReport, [medalloPkg]);

        return buildLintReport({
            entry: [`medallo`, `1.0.0`],
            lintFile: { rules },
            depth: 0
        });
    }

    function setup(params?: undefined): Promise<Parameters<ILintCheck<undefined>["check"]>>;
    function setup<T>(params: T): Promise<Parameters<ILintCheck<T>["check"]>>;
    function setup(params: any) {
        return new Promise((resolve, reject) => {
            const rule = createRule(
                "error",
                {
                    name: "some-check",
                    check: (...args) => {
                        resolve([...args]);
                    }
                },
                params
            );

            const { reportService } = setupLintService([rule]);

            reportService.process().then((exitCode = 0) => {
                if (exitCode !== 0) {
                    reject(new Error(`Linting failed with exit code ${exitCode}`));
                }
            });
        });
    }

    function setupWithAttachment<A extends Attachments>(
        attachment: A,
        params?: undefined
    ): Promise<Parameters<ILintCheck<undefined, A>["check"]>>;
    function setupWithAttachment<A extends Attachments, T>(
        attachment: A,
        params: T
    ): Promise<Parameters<ILintCheck<T, A>["check"]>>;
    function setupWithAttachment<A extends Attachments>(attachment: A, params: any) {
        return new Promise((resolve, reject) => {
            const rule = createRuleWithAttachment(
                "error",
                {
                    name: "some-check",
                    check: (...args) => {
                        resolve([...args]);
                    },
                    attachments: attachment
                },
                params
            );

            // @ts-expect-error
            const { reportService } = setupLintService([rule]);

            reportService.process().then((exitCode = 0) => {
                if (exitCode !== 0) {
                    reject(new Error(`Linting failed with exit code ${exitCode}`));
                }
            });
        });
    }

    test(`creates rule without params and without attachments`, async () => {
        const [pkg, params] = await setup();
        const alias: undefined = params;

        expect(alias).toBeUndefined();
    });

    test(`creates rule with params and without attachments`, async () => {
        const [pkg, params] = await setup("params");
        const alias: string = params;

        expect(alias).toEqual("params");
    });

    test(`creates rule without params and with attachments`, async () => {
        const [pkg, params] = await setupWithAttachment({ mock: mockAttachment });
        const alias: undefined = params;
        const attachmentData: number = pkg.getAttachmentData("mock");

        expect(alias).toBeUndefined();
        expect(attachmentData).toEqual(3);
    });

    test(`creates rule with params and with attachments`, async () => {
        const [pkg, params] = await setupWithAttachment({ mock: mockAttachment }, "params");
        const alias: string = params;
        const attachmentData: number = pkg.getAttachmentData("mock");

        expect(alias).toEqual("params");
        expect(attachmentData).toEqual(3);
    });
});
