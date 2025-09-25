import { describe, test, expect } from "vitest";
import { z } from "zod";

import type { AttachmentFn } from "../../../shared/src/attachments/Attachments.js";
import { LintReport } from "../../src/reports/lint/LintReport.js";
import {
    createRule,
    createRuleWithAttachment,
    type ILintFile
} from "../../src/reports/lint/LintRule.js";
import { createReportServiceFactory } from "../../../test-utils/src/common.js";
import type { IMockPackageJson } from "../../../test-utils/src/mocks.js";
import { rule } from "../../src/reports/lint/RuleBuilder.js";

describe(`Rule Builder`, () => {
    const mockAttachment: AttachmentFn<number> = async () => {
        return 3;
    };
    const attachments = { mock: mockAttachment };

    function setupLintService(rules: ILintFile["rules"]) {
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

    test(`should build a simple rule with no params`, async () => {
        expect.assertions(1);

        const builtRule = rule("my-rule")
            .check((pkg, params) => {
                expect(params).toBeUndefined();
            })
            .build();

        const lintRule = createRule("error", builtRule);
        const { reportService } = setupLintService([lintRule]);

        await reportService.process();
    });

    test("should build a rule with params", async () => {
        expect.assertions(1);

        const builtRule = rule("my-rule")
            .withParams(z.object({ foo: z.string() }))
            .check((pkg, params) => {
                expect(params.foo).toBe("bar");
            })
            .build();

        const lintRule = createRule("error", builtRule, { foo: "bar" });
        const { reportService } = setupLintService([lintRule]);

        await reportService.process();
    });

    test(`should add checkParams only if params are provided`, () => {
        expect.assertions(2);

        const builtRule = rule("my-rule")
            .withParams(z.object({ foo: z.string() }))
            .check((pkg, params) => {
                expect(params.foo).toBe("bar");
            })
            .build();

        expect(builtRule.checkParams?.().safeParse({ foo: "bar" }).success).toBe(true);
        expect(builtRule.checkParams?.().safeParse({ foo: [] }).success).toBe(false);
    });

    test("should build a rule with attachments", async () => {
        expect.assertions(2);

        const builtRule = rule("my-rule")
            .withAttachments(attachments)
            .check((pkg, params) => {
                const data = pkg.getAttachmentData("mock");

                expect(data).toBe(3);
                expect(params).toBeUndefined();
            })
            .build();

        const lintRule = createRuleWithAttachment("error", builtRule);
        const { reportService } = setupLintService([lintRule]);

        await reportService.process();
    });

    test("should build a rule with attachments and params", async () => {
        expect.assertions(2);

        const builtRule = rule("my-rule")
            .withAttachments(attachments)
            .withParams(z.object({ foo: z.string() }))
            .check((pkg, params) => {
                const data = pkg.getAttachmentData("mock");

                expect(data).toBe(3);
                expect(params.foo).toBe("bar");
            })
            .build();

        const lintRule = createRuleWithAttachment("error", builtRule, { foo: "bar" });
        const { reportService } = setupLintService([lintRule]);

        await reportService.process();
    });

    test("should be frozen", () => {
        const builtRule = rule("my-rule")
            .check(() => {})
            .build();

        expect(Object.isFrozen(builtRule)).toBe(true);
    });
});
