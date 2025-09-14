import { describe, test, expect } from "vitest";

import { ZodLintRule } from "../../src/reports/lint/LintRule.js";

describe(`Lint Rule Validation`, () => {
    test(`parses error rule`, () => {
        const rule = [
            `error`,
            {
                name: `test-rule`,
                check: () => {}
            }
        ];

        expect(ZodLintRule.safeParse(rule).success).toBe(true);
    });

    test(`parses warning rule`, () => {
        const rule = [
            `warning`,
            {
                name: `test-rule`,
                check: () => {}
            }
        ];

        expect(ZodLintRule.safeParse(rule).success).toBe(true);
    });

    test(`fails on invalid type`, () => {
        const rule = [
            `abc`,
            {
                name: `test-rule`,
                check: () => {}
            }
        ];

        expect(ZodLintRule.safeParse(rule).success).toBe(false);
    });

    test(`fails on missing name`, () => {
        const rule = [
            `warning`,
            {
                check: () => {}
            }
        ];

        expect(ZodLintRule.safeParse(rule).success).toBe(false);
    });

    test(`fails on missing check callback`, () => {
        const rule = [
            `warning`,
            {
                name: `test-rule`
            }
        ];

        expect(ZodLintRule.safeParse(rule).success).toBe(false);
    });

    test(`fails on missing lint rule`, () => {
        const rule = [`warning`];

        expect(ZodLintRule.safeParse(rule).success).toBe(false);
    });

    test(`fails on empty lint rule`, () => {
        const rule = [`warning`, {}];

        expect(ZodLintRule.safeParse(rule).success).toBe(false);
    });

    test(`fails on invalid rule defs`, () => {
        expect(ZodLintRule.safeParse({}).success).toBe(false);
        expect(ZodLintRule.safeParse([]).success).toBe(false);
        expect(ZodLintRule.safeParse(``).success).toBe(false);
        expect(ZodLintRule.safeParse(23).success).toBe(false);
        expect(ZodLintRule.safeParse(true).success).toBe(false);
    });
});
