import { describe, test, expect, vi } from "vitest";
import z from "zod";

import { LintReport } from "../../src/reports/lint/LintReport.js";
import { createRule } from "../../src/reports/lint/LintRule.js";
import { createReportServiceFactory } from "../../../test-utils/src/common.js";
import type { IMockPackageJson } from "../../../test-utils/src/mocks.js";

const medalloPkg: IMockPackageJson = {
    name: `medallo`,
    version: `1.0.0`,
    dependencies: [
        { name: `foo`, version: `1.0.0` },
        { name: `bar`, version: `1.0.0` }
    ]
};

const buildLintReport = createReportServiceFactory(LintReport, [medalloPkg]);

describe(`LintReport Tests`, () => {
    test(`calls lint function only on root`, async () => {
        const mockFn = vi.fn();
        const { reportService } = buildLintReport({
            entry: [`medallo`, `1.0.0`],
            lintFile: { rules: [createRule(`error`, { name: `test-rule`, check: mockFn })] },
            depth: 0
        });

        await reportService.process();

        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test(`uses custom validation from lint check`, async () => {
        const validateFn = vi.fn();
        const { reportService } = buildLintReport({
            entry: [`medallo`, `1.0.0`],
            lintFile: {
                rules: [
                    createRule(
                        `error`,
                        {
                            name: `test-rule`,
                            check: () => {},
                            checkParams: () => z.custom(validateFn)
                        },
                        { name: `medallo` }
                    )
                ]
            },
            depth: 0
        });

        await reportService.process();

        expect(validateFn).toHaveBeenCalledTimes(1);
    });

    test(`correctly throws on failed custom validation`, async () => {
        expect.assertions(1);

        const { reportService, stdout } = buildLintReport({
            entry: [`medallo`, `1.0.0`],
            lintFile: {
                rules: [
                    createRule(
                        `error`,
                        {
                            name: `test-rule`,
                            check: () => {},
                            checkParams: () => z.custom(() => false)
                        },
                        "some param"
                    )
                ]
            },
            depth: 0
        });

        await reportService.process();

        expect(stdout.lines).toMatchSnapshot();
    });

    test(`calls lint function with custom params`, async () => {
        expect.assertions(3);

        const { reportService, stdout } = buildLintReport({
            entry: [`medallo`, `1.0.0`],
            lintFile: {
                rules: [
                    createRule(
                        `error`,
                        {
                            name: `test-rule`,
                            check: (_, params) => {
                                expect(params.foo).toBe(`bar`);
                            }
                        },
                        { foo: `bar` }
                    )
                ]
            },
            depth: Infinity
        });

        await reportService.process();
    });

    test(`sets exitCode to 1 if at least 1 error is reported`, async () => {
        const { reportService } = buildLintReport({
            entry: [`medallo`, `1.0.0`],
            lintFile: {
                rules: [
                    createRule(`warning`, { name: `test-rule-warning`, check: () => `` }, {}),
                    createRule(`error`, { name: `test-rule-error`, check: () => `` }, {})
                ]
            },
            depth: Infinity
        });

        const exitCode = await reportService.process();

        expect(exitCode).toBe(1);
    });

    test(`sets exitCode to 0 if only warnings are reported`, async () => {
        const { reportService } = buildLintReport({
            entry: [`medallo`, `1.0.0`],
            lintFile: {
                rules: [createRule(`warning`, { name: `test-rule-warning`, check: () => `` }, {})]
            },
            depth: Infinity
        });

        const exitCode = await reportService.process();

        expect(exitCode).toBe(0);
    });

    test(`lint check can return a string`, async () => {
        const { reportService, stdout } = buildLintReport({
            entry: [`medallo`, `1.0.0`],
            lintFile: {
                rules: [createRule(`error`, { name: `test-rule`, check: () => `error message` })]
            },
            depth: 0
        });

        expect.assertions(1);
        await reportService.process();

        expect(stdout.lines).toMatchSnapshot();
    });

    test(`lint check can return a string array`, async () => {
        const { reportService, stdout } = buildLintReport({
            entry: [`medallo`, `1.0.0`],
            lintFile: {
                rules: [
                    createRule(`error`, {
                        name: `test-rule`,
                        check: () => [`error message 1`, `error message 2`]
                    })
                ]
            },
            depth: 0
        });

        expect.assertions(1);
        await reportService.process();

        expect(stdout.lines).toMatchSnapshot();
    });

    test(`writes help message on invalid lint check return type`, async () => {
        // inlining the rule won't apply the @ts-expect-error
        const rule = createRule(`error`, {
            name: `test-rule`,
            // @ts-expect-error
            check: () => 3
        });

        const { reportService, stdout } = buildLintReport({
            entry: [`medallo`, `1.0.0`],
            lintFile: {
                rules: [rule]
            },
            depth: 0
        });

        expect.assertions(1);
        await reportService.process();

        expect(stdout.lines).toMatchSnapshot();
    });

    test(`sets exitCode to 1 if there are internal errors`, async () => {
        const { reportService } = buildLintReport({
            entry: [`medallo`, `1.0.0`],
            lintFile: {
                rules: [
                    createRule(`warning`, { name: `report-all`, check: () => `` }, {}),
                    createRule(
                        `warning`,
                        {
                            name: `will-throw`,
                            check: () => {
                                throw new Error(`whoops`);
                            }
                        },
                        {}
                    )
                ]
            },
            depth: Infinity
        });

        const exitCode = await reportService.process();

        expect(exitCode).toBe(1);
    });

    test(`prints out internal errors & exit message`, async () => {
        const { reportService, stdout, stderr } = buildLintReport({
            entry: [`medallo`, `1.0.0`],
            lintFile: {
                rules: [
                    createRule(`warning`, { name: `report-all`, check: () => `` }, {}),
                    createRule(
                        `warning`,
                        {
                            name: `will-throw`,
                            check: () => {
                                throw new Error(`whoops`);
                            }
                        },
                        {}
                    )
                ]
            },
            depth: Infinity
        });

        await reportService.process();

        expect(stdout.lines).toMatchSnapshot();
        expect(stderr.lines).toMatchSnapshot();
    });
});
