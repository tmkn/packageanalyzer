import { ZodLintRule, createRule } from "../../src/reports/lint/LintRule";
import { LintReport } from "../../src/reports/LintReport";
import { ReportService } from "../../src/reports/ReportService";
import { createMockContext } from "../common";
import { IMockPackageJson, MockProvider } from "../mocks";

describe(`LintReport Test`, () => {
    const medalloPkg: IMockPackageJson = {
        name: `medallo`,
        version: `1.0.0`,
        dependencies: [
            { name: `foo`, version: `1.0.0` },
            { name: `bar`, version: `1.0.0` }
        ]
    };
    const provider = new MockProvider([medalloPkg]);

    beforeEach(() => {
        jest.resetModules();
    });

    test(`calls lint function for all dependencies`, async () => {
        const mockFn = jest.fn();
        jest.doMock(
            `/getsMockedAnyway.js`,
            () => ({
                rules: [createRule(`error`, { name: `test-rule`, check: mockFn })]
            }),
            {
                virtual: true
            }
        );

        const lintReport = new LintReport({
            lintFile: `/getsMockedAnyway.js`,
            package: `medallo@1.0.0`,
            depth: Infinity
        });
        lintReport.provider = provider;

        const { stdout, stderr } = createMockContext();
        const reportService = new ReportService(
            {
                reports: [lintReport]
            },
            stdout,
            stderr
        );

        await reportService.process();

        expect(mockFn).toBeCalledTimes(3);
    });

    test(`calls lint function only on root`, async () => {
        const mockFn = jest.fn();
        jest.doMock(
            `/getsMockedAnyway.js`,
            () => ({
                rules: [createRule(`error`, { name: `test-rule`, check: mockFn })]
            }),
            {
                virtual: true
            }
        );

        const lintReport = new LintReport({
            lintFile: `/getsMockedAnyway.js`,
            package: `medallo@1.0.0`,
            depth: 0
        });
        lintReport.provider = provider;

        const { stdout, stderr } = createMockContext();
        const reportService = new ReportService(
            {
                reports: [lintReport]
            },
            stdout,
            stderr
        );

        await reportService.process();

        expect(mockFn).toBeCalledTimes(1);
    });

    test(`calls lint function with custom params`, async () => {
        jest.doMock(
            `/getsMockedAnyway.js`,
            () => ({
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
            }),
            {
                virtual: true
            }
        );

        const lintReport = new LintReport({
            lintFile: `/getsMockedAnyway.js`,
            package: `medallo@1.0.0`,
            depth: Infinity
        });
        lintReport.provider = provider;

        const { stdout, stderr } = createMockContext();
        const reportService = new ReportService(
            {
                reports: [lintReport]
            },
            stdout,
            stderr
        );

        expect.assertions(3);
        await reportService.process();
    });

    test(`sets exitCode to 1 if at least 1 error is reported`, async () => {
        jest.doMock(
            `/getsMockedAnyway.js`,
            () => ({
                rules: [
                    createRule(`warning`, { name: `test-rule-warning`, check: () => `` }, {}),
                    createRule(`error`, { name: `test-rule-error`, check: () => `` }, {})
                ]
            }),
            {
                virtual: true
            }
        );

        const lintReport = new LintReport({
            lintFile: `/getsMockedAnyway.js`,
            package: `medallo@1.0.0`,
            depth: Infinity
        });
        lintReport.provider = provider;

        const { stdout, stderr } = createMockContext();
        const reportService = new ReportService(
            {
                reports: [lintReport]
            },
            stdout,
            stderr
        );

        const exitCode = await reportService.process();

        expect(exitCode).toBe(1);
    });

    test(`sets exitCode to 0 if only warnings are reported`, async () => {
        jest.doMock(
            `/getsMockedAnyway.js`,
            () => ({
                rules: [createRule(`warning`, { name: `test-rule-warning`, check: () => `` }, {})]
            }),
            {
                virtual: true
            }
        );

        const lintReport = new LintReport({
            lintFile: `/getsMockedAnyway.js`,
            package: `medallo@1.0.0`,
            depth: Infinity
        });
        lintReport.provider = provider;

        const { stdout, stderr } = createMockContext();
        const reportService = new ReportService(
            {
                reports: [lintReport]
            },
            stdout,
            stderr
        );

        const exitCode = await reportService.process();

        expect(exitCode).toBe(0);
    });
});

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
