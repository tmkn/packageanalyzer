import path from "path";

import { z } from "zod";
import { ILintFile, ZodLintRule, createRule } from "../../src/reports/lint/LintRule";
import { createMockContext } from "../common";
import { IMockPackageJson, MockProvider } from "../mocks";
import { LintService } from "../../src/reports/lint/LintService";
import { LintFileLoader } from "../../src/reports/lint/RulesLoader";

describe(`Lint Service Test`, () => {
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

    test(`loads and executes lint file with absolute path`, async () => {
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

        const { stdout, stderr } = createMockContext();
        const lintService = new LintService(
            {
                entry: [`medallo`, `1.0.0`],
                loader: new LintFileLoader(`/getsMockedAnyway.js`),
                depth: Infinity,
                provider
            },
            stdout,
            stderr
        );

        await lintService.process();

        expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test(`loads and executes lint file with relative path`, async () => {
        const mockFn = jest.fn();
        jest.doMock(
            path.join(process.cwd(), `./getsMockedAnyway.js`),
            () => ({
                rules: [createRule(`error`, { name: `test-rule`, check: mockFn })]
            }),
            {
                virtual: true
            }
        );

        const { stdout, stderr } = createMockContext();
        const lintService = new LintService(
            {
                entry: [`medallo`, `1.0.0`],
                loader: new LintFileLoader(`./getsMockedAnyway.js`),
                depth: Infinity,
                provider
            },
            stdout,
            stderr
        );

        await lintService.process();

        expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test(`errors on invalid lint file`, async () => {
        jest.doMock(`/getsMockedAnyway.js`, () => ({}), {
            virtual: true
        });

        const { stdout, stderr } = createMockContext();
        const lintService = new LintService(
            {
                entry: [`medallo`, `1.0.0`],
                loader: new LintFileLoader(`/getsMockedAnyway.js`),
                depth: Infinity,
                provider
            },
            stdout,
            stderr
        );

        expect.assertions(2);
        const exitCode = await lintService.process();

        expect(stderr.lines).toMatchSnapshot();
        expect(exitCode).toBe(1);
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

        const { stdout, stderr } = createMockContext();
        const lintService = new LintService(
            {
                entry: [`medallo`, `1.0.0`],
                loader: new LintFileLoader(`/getsMockedAnyway.js`),
                depth: 0,
                provider
            },
            stdout,
            stderr
        );

        await lintService.process();

        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test(`uses custom validation from lint check`, async () => {
        const validateFn = jest.fn();
        jest.doMock(
            `/getsMockedAnyway.js`,
            () => ({
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
            }),
            {
                virtual: true
            }
        );

        const { stdout, stderr } = createMockContext();
        const lintService = new LintService(
            {
                entry: [`medallo`, `1.0.0`],
                loader: new LintFileLoader(`/getsMockedAnyway.js`),
                depth: 0,
                provider
            },
            stdout,
            stderr
        );

        await lintService.process();

        expect(validateFn).toHaveBeenCalledTimes(1);
    });

    test(`correctly throws on failed custom validation`, async () => {
        jest.doMock(
            `/getsMockedAnyway.js`,
            () => ({
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
            }),
            {
                virtual: true
            }
        );

        const { stdout, stderr } = createMockContext();
        const lintService = new LintService(
            {
                entry: [`medallo`, `1.0.0`],
                loader: new LintFileLoader(`/getsMockedAnyway.js`),
                depth: 0,
                provider
            },
            stdout,
            stderr
        );

        expect.assertions(1);
        await lintService.process();

        expect(stdout.lines).toMatchSnapshot();
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

        const { stdout, stderr } = createMockContext();
        const lintService = new LintService(
            {
                entry: [`medallo`, `1.0.0`],
                loader: new LintFileLoader(`/getsMockedAnyway.js`),
                depth: Infinity,
                provider
            },
            stdout,
            stderr
        );

        expect.assertions(3);
        await lintService.process();
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

        const { stdout, stderr } = createMockContext();
        const lintService = new LintService(
            {
                entry: [`medallo`, `1.0.0`],
                loader: new LintFileLoader(`/getsMockedAnyway.js`),
                depth: Infinity,
                provider
            },
            stdout,
            stderr
        );

        const exitCode = await lintService.process();

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

        const { stdout, stderr } = createMockContext();
        const lintService = new LintService(
            {
                entry: [`medallo`, `1.0.0`],
                loader: new LintFileLoader(`/getsMockedAnyway.js`),
                depth: Infinity,
                provider
            },
            stdout,
            stderr
        );

        const exitCode = await lintService.process();

        expect(exitCode).toBe(0);
    });

    test(`lint check can return a string`, async () => {
        jest.doMock(
            `/getsMockedAnyway.js`,
            () => ({
                rules: [createRule(`error`, { name: `test-rule`, check: () => `error message` })]
            }),
            {
                virtual: true
            }
        );

        const { stdout, stderr } = createMockContext();
        const lintService = new LintService(
            {
                entry: [`medallo`, `1.0.0`],
                loader: new LintFileLoader(`/getsMockedAnyway.js`),
                depth: 0,
                provider
            },
            stdout,
            stderr
        );

        expect.assertions(1);
        await lintService.process();

        expect(stdout.lines).toMatchSnapshot();
    });

    test(`lint check can return a string array`, async () => {
        jest.doMock(
            `/getsMockedAnyway.js`,
            () => ({
                rules: [
                    createRule(`error`, {
                        name: `test-rule`,
                        check: () => [`error message 1`, `error message 2`]
                    })
                ]
            }),
            {
                virtual: true
            }
        );

        const { stdout, stderr } = createMockContext();
        const lintService = new LintService(
            {
                entry: [`medallo`, `1.0.0`],
                loader: new LintFileLoader(`/getsMockedAnyway.js`),
                depth: 0,
                provider
            },
            stdout,
            stderr
        );

        expect.assertions(1);
        await lintService.process();

        expect(stdout.lines).toMatchSnapshot();
    });

    test(`writes help message on invalid lint check return type`, async () => {
        jest.doMock(
            `/getsMockedAnyway.js`,
            () => ({
                rules: [
                    createRule(`error`, {
                        name: `test-rule`,
                        // @ts-expect-error
                        check: () => 3
                    })
                ]
            }),
            {
                virtual: true
            }
        );

        const { stdout, stderr } = createMockContext();
        const lintService = new LintService(
            {
                entry: [`medallo`, `1.0.0`],
                loader: new LintFileLoader(`/getsMockedAnyway.js`),
                depth: 0,
                provider
            },
            stdout,
            stderr
        );

        expect.assertions(1);
        await lintService.process();

        expect(stdout.lines).toMatchSnapshot();
    });
});

describe(`"internal-error" Lint Test`, () => {
    const medalloPkg: IMockPackageJson = {
        name: `medallo`,
        version: `1.0.0`,
        dependencies: [
            { name: `foo`, version: `1.0.0` },
            { name: `bar`, version: `1.0.0` }
        ]
    };
    const provider = new MockProvider([medalloPkg]);

    const lintFile: ILintFile = {
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
    };

    beforeEach(() => {
        jest.resetModules();
    });

    test(`sets exitCode to 1 if there are internal errors`, async () => {
        jest.doMock(`/getsMockedAnyway.js`, () => lintFile, {
            virtual: true
        });

        const { stdout, stderr } = createMockContext();
        const lintService = new LintService(
            {
                entry: [`medallo`, `1.0.0`],
                loader: new LintFileLoader(`/getsMockedAnyway.js`),
                depth: Infinity,
                provider
            },
            stdout,
            stderr
        );

        const exitCode = await lintService.process();

        expect(exitCode).toBe(1);
    });

    test(`prints out internal errors & exit message`, async () => {
        jest.doMock(`/getsMockedAnyway.js`, () => lintFile, {
            virtual: true
        });

        const { stdout, stderr } = createMockContext();
        const lintService = new LintService(
            {
                entry: [`medallo`, `1.0.0`],
                loader: new LintFileLoader(`/getsMockedAnyway.js`),
                depth: Infinity,
                provider
            },
            stdout,
            stderr
        );

        await lintService.process();

        expect(stdout.lines).toMatchSnapshot();
        expect(stderr.lines).toMatchSnapshot();
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
