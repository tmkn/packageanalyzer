import { type IAttachment } from "../../src/index.js";
import { type IApplyArgs } from "../../src/attachments/Attachments.js";
import { createRuleWithAttachment, type ILintFile } from "../../src/reports/lint/LintRule.js";
import { LintService } from "../../src/reports/lint/LintService.js";
import { type IRulesLoader } from "../../src/reports/lint/RulesLoader.js";
import { createMockContext } from "../common.js";
import { type IMockPackageJson, MockProvider } from "../mocks.js";

describe(`Lint Service Attachment Tests`, () => {
    const medalloPkg: IMockPackageJson = {
        name: `medallo`,
        version: `1.0.0`,
        dependencies: [
            { name: `foo`, version: `1.0.0` },
            { name: `bar`, version: `1.0.0` }
        ]
    };

    const provider = new MockProvider([medalloPkg]);

    class MockAttachment1 implements IAttachment<"mock", string> {
        readonly key = "mock";
        readonly name = "Mock Attachment";
        async apply({ p }: IApplyArgs) {
            return `${p.name} 13`;
        }
    }

    class MockAttachment2 implements IAttachment<"mock2", string> {
        readonly key = "mock2";
        readonly name = "Mock Attachment 2";
        async apply({ p }: IApplyArgs) {
            return `${p.name} 23`;
        }
    }

    const createLoader = (rules: ILintFile["rules"]): IRulesLoader => {
        return {
            getRules: async () => ({
                rules
            })
        };
    };

    test(`correctly processes a rule with 1 attachment`, async () => {
        const ruleWithAttachment = createRuleWithAttachment("error", {
            name: "some-check",
            check: pkg => {
                const data: string = pkg.getAttachmentData("mock");

                expect(data).toBe(`${pkg.name} 13`);
            },
            attachments: [new MockAttachment1()]
        });

        const { stdout, stderr } = createMockContext();
        const lintService = new LintService(
            {
                entry: [`medallo`, `1.0.0`],
                loader: createLoader([ruleWithAttachment]),
                depth: Infinity,
                provider
            },
            stdout,
            stderr
        );

        expect.assertions(3);
        await lintService.process();
    });

    test(`correctly processes a rule with multiple attachments`, async () => {
        const ruleWithAttachment = createRuleWithAttachment("error", {
            name: "some-check",
            check: pkg => {
                const data1: string = pkg.getAttachmentData("mock");
                const data2: string = pkg.getAttachmentData("mock2");

                expect(data1).toBe(`${pkg.name} 13`);
                expect(data2).toBe(`${pkg.name} 23`);
            },
            attachments: [new MockAttachment1(), new MockAttachment2()]
        });

        const { stdout, stderr } = createMockContext();
        const lintService = new LintService(
            {
                entry: [`medallo`, `1.0.0`],
                loader: createLoader([ruleWithAttachment]),
                depth: Infinity,
                provider
            },
            stdout,
            stderr
        );

        expect.assertions(6);
        await lintService.process();
    });

    test(`correctly processes multiple rules with 1 attachment each`, async () => {
        const ruleWithAttachment = createRuleWithAttachment("error", {
            name: "some-check",
            check: pkg => {
                const data: string = pkg.getAttachmentData("mock");

                expect(data).toBe(`${pkg.name} 13`);
            },
            attachments: [new MockAttachment1()]
        });

        const ruleWithAttachment2 = createRuleWithAttachment("error", {
            name: "some-check-2",
            check: pkg => {
                const data: string = pkg.getAttachmentData("mock2");

                expect(data).toBe(`${pkg.name} 23`);
            },
            attachments: [new MockAttachment2()]
        });

        const { stdout, stderr } = createMockContext();
        const lintService = new LintService(
            {
                entry: [`medallo`, `1.0.0`],
                loader: createLoader([ruleWithAttachment, ruleWithAttachment2]),
                depth: Infinity,
                provider
            },
            stdout,
            stderr
        );

        expect.assertions(6);
        await lintService.process();
    });

    test(`correctly processes multiple rules with multiple attachments each`, async () => {
        const ruleWithAttachment = createRuleWithAttachment("error", {
            name: "some-check",
            check: pkg => {
                const data1: string = pkg.getAttachmentData("mock");
                const data2: string = pkg.getAttachmentData("mock2");

                expect(data1).toBe(`${pkg.name} 13`);
                expect(data2).toBe(`${pkg.name} 23`);
            },
            attachments: [new MockAttachment2(), new MockAttachment1()]
        });

        const ruleWithAttachment2 = createRuleWithAttachment("error", {
            name: "some-check-2",
            check: pkg => {
                const data1: string = pkg.getAttachmentData("mock");
                const data2: string = pkg.getAttachmentData("mock2");

                expect(data1).toBe(`${pkg.name} 13`);
                expect(data2).toBe(`${pkg.name} 23`);
            },
            attachments: [new MockAttachment1(), new MockAttachment2()]
        });

        const { stdout, stderr } = createMockContext();
        const lintService = new LintService(
            {
                entry: [`medallo`, `1.0.0`],
                loader: createLoader([ruleWithAttachment, ruleWithAttachment2]),
                depth: Infinity,
                provider
            },
            stdout,
            stderr
        );

        expect.assertions(12);
        await lintService.process();
    });

    test(`prints internal error when attachment fails`, async () => {
        const ruleWithAttachment = createRuleWithAttachment("error", {
            name: "some-check",
            check: pkg => {
                // trigger attachment error
                pkg.getAttachmentData("mock");
            },
            attachments: [
                new (class implements IAttachment<"mock", string> {
                    readonly key = "mock";
                    readonly name = "Mock Attachment";
                    async apply() {
                        throw new Error(`Attachment failed intentionally`);

                        return `13`;
                    }
                })()
            ]
        });

        const { stdout, stderr } = createMockContext();
        const lintService = new LintService(
            {
                entry: [`medallo`, `1.0.0`],
                loader: createLoader([ruleWithAttachment]),
                depth: Infinity,
                provider
            },
            stdout,
            stderr
        );

        await lintService.process();
        const logOutput = stdout.lines.join(`\n`);

        expect(logOutput).toContain(`internal error`);
    });
});
