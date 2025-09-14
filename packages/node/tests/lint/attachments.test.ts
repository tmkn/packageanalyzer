import { describe, test, expect } from "vitest";

import { type AttachmentFn } from "../../src/index.js";
import { type IApplyArgs } from "../../../shared/src/attachments/Attachments.js";
import { createRuleWithAttachment, type ILintFile } from "../../src/reports/lint/LintRule.js";
import {
    createReportServiceFactory,
    type ReportServiceContext
} from "../../../test-utils/src/common.js";
import { LintReport } from "../../src/reports/lint/LintReport.js";
import type { IMockPackageJson } from "../../../test-utils/src/mocks.js";

describe(`Lint Service Attachment Tests`, () => {
    function setup(rules: ILintFile["rules"]): ReportServiceContext<LintReport> {
        const medalloPkg: IMockPackageJson = {
            name: `medallo`,
            version: `1.0.0`,
            dependencies: [
                { name: `foo`, version: `1.0.0` },
                { name: `bar`, version: `1.0.0` }
            ]
        };

        const buildLintReport = createReportServiceFactory(LintReport, [medalloPkg]);

        return buildLintReport({
            entry: [`medallo`, `1.0.0`],
            lintFile: { rules },
            depth: Infinity
        });
    }

    const mockAttachment1: AttachmentFn<string> = async ({ p }: IApplyArgs) => `${p.name} 13`;

    const mockAttachment2: AttachmentFn<string> = async ({ p }: IApplyArgs) => `${p.name} 23`;

    type Assertion = [value: string, expected: string];

    test(`correctly processes a rule with 1 attachment`, async () => {
        const assertions: Assertion[] = [];
        const ruleWithAttachment = createRuleWithAttachment("error", {
            name: "some-check",
            check: pkg => {
                const data: string = pkg.getAttachmentData("mock");

                // need to collect assertions here as expects would be swallowed by the reportService
                assertions.push([data, `${pkg.name} 13`]);
            },
            attachments: { mock: mockAttachment1 }
        });

        expect.assertions(3);

        const { reportService } = setup([ruleWithAttachment]);
        await reportService.process();

        assertions.forEach(([expected, value]) => {
            expect(expected).toBe(value);
        });
    });

    test(`correctly processes a rule with multiple attachments`, async () => {
        const assertions: Assertion[] = [];
        const ruleWithAttachment = createRuleWithAttachment("error", {
            name: "some-check",
            check: pkg => {
                const data1: string = pkg.getAttachmentData("mock");
                const data2: string = pkg.getAttachmentData("mock2");

                assertions.push([data1, `${pkg.name} 13`]);
                assertions.push([data2, `${pkg.name} 23`]);
            },
            attachments: { mock: mockAttachment1, mock2: mockAttachment2 }
        });

        expect.assertions(6);
        const { reportService } = setup([ruleWithAttachment]);
        await reportService.process();

        assertions.forEach(([expected, value]) => {
            expect(expected).toBe(value);
        });
    });

    test(`correctly processes multiple rules with 1 attachment each`, async () => {
        const assertions: Assertion[] = [];
        const ruleWithAttachment = createRuleWithAttachment("error", {
            name: "some-check",
            check: pkg => {
                const data: string = pkg.getAttachmentData("mock");

                assertions.push([data, `${pkg.name} 13`]);
            },
            attachments: { mock: mockAttachment1 }
        });

        const ruleWithAttachment2 = createRuleWithAttachment("error", {
            name: "some-check-2",
            check: pkg => {
                const data: string = pkg.getAttachmentData("mock2");

                assertions.push([data, `${pkg.name} 23`]);
            },
            attachments: { mock2: mockAttachment2 }
        });

        expect.assertions(6);
        const { reportService } = setup([ruleWithAttachment, ruleWithAttachment2]);
        await reportService.process();

        assertions.forEach(([expected, value]) => {
            expect(expected).toBe(value);
        });
    });

    test(`correctly processes multiple rules with multiple attachments each`, async () => {
        const assertions: Assertion[] = [];
        const ruleWithAttachment = createRuleWithAttachment("error", {
            name: "some-check",
            check: pkg => {
                const data1: string = pkg.getAttachmentData("mock");
                const data2: string = pkg.getAttachmentData("mock2");

                assertions.push([data1, `${pkg.name} 13`]);
                assertions.push([data2, `${pkg.name} 23`]);
            },
            attachments: { mock: mockAttachment1, mock2: mockAttachment2 }
        });

        const ruleWithAttachment2 = createRuleWithAttachment("error", {
            name: "some-check-2",
            check: pkg => {
                const data1: string = pkg.getAttachmentData("mock");
                const data2: string = pkg.getAttachmentData("mock2");

                assertions.push([data1, `${pkg.name} 13`]);
                assertions.push([data2, `${pkg.name} 23`]);
            },
            attachments: { mock: mockAttachment1, mock2: mockAttachment2 }
        });

        expect.assertions(12);
        const { reportService } = setup([ruleWithAttachment, ruleWithAttachment2]);
        await reportService.process();

        assertions.forEach(([expected, value]) => {
            expect(expected).toBe(value);
        });
    });

    test(`prints internal error when attachment fails`, async () => {
        const ruleWithAttachment = createRuleWithAttachment("error", {
            name: "some-check",
            check: pkg => {
                // trigger attachment error
                pkg.getAttachmentData("mock");
            },
            attachments: {
                mock: async () => {
                    throw new Error(`Attachment failed intentionally`);

                    return `13`;
                }
            }
        });

        const { reportService, stdout } = setup([ruleWithAttachment]);
        await reportService.process();
        const logOutput = stdout.lines.join(`\n`);

        expect(logOutput).toContain(`internal error`);
    });
});
