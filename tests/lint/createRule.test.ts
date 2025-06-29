import type { IApplyArgs, IAttachment } from "../../src/attachments/Attachments.js";
import {
    createRule,
    createRuleWithAttachment,
    type ILintCheck,
    type ILintFile
} from "../../src/reports/lint/LintRule.js";
import { LintService } from "../../src/reports/lint/LintService.js";
import { LintFileLoader } from "../../src/reports/lint/RulesLoader.js";
import { createMockContext } from "../common.js";
import { type IMockPackageJson, MockProvider } from "../mocks.js";

describe(`createRule tests`, () => {
    const mockAttachment = new (class implements IAttachment<"mock", number> {
        readonly key = "mock";
        readonly name = "Mock Attachment";
        async apply(args: IApplyArgs) {
            return 3;
        }
    })();

    function setupLintService(rules: ILintFile["rules"]): LintService {
        const medalloPkg: IMockPackageJson = {
            name: `medallo`,
            version: `1.0.0`
        };
        const provider = new MockProvider([medalloPkg]);

        vi.doMock(`/getsMockedAnyway.js`, () => ({
            default: {
                rules
            }
        }));

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

        return lintService;
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

            const lintService = setupLintService([rule]);

            lintService.process().then((exitCode = 0) => {
                if (exitCode !== 0) {
                    reject(new Error(`Linting failed with exit code ${exitCode}`));
                }
            });
        });
    }

    function setupWithAttachment<A extends IAttachment<string, any>>(
        attachment: A,
        params?: undefined
    ): Promise<Parameters<ILintCheck<undefined, [A]>["check"]>>;
    function setupWithAttachment<A extends IAttachment<string, any>, T>(
        attachment: A,
        params: T
    ): Promise<Parameters<ILintCheck<T, [A]>["check"]>>;
    function setupWithAttachment<A extends IAttachment<string, any>>(attachment: A, params: any) {
        return new Promise((resolve, reject) => {
            const rule = createRuleWithAttachment(
                "error",
                {
                    name: "some-check",
                    check: (...args) => {
                        resolve([...args]);
                    },
                    attachments: [attachment]
                },
                params
            );

            // @ts-expect-error
            const lintService = setupLintService([rule]);

            lintService.process().then((exitCode = 0) => {
                if (exitCode !== 0) {
                    reject(new Error(`Linting failed with exit code ${exitCode}`));
                }
            });
        });
    }

    beforeEach(() => {
        vi.resetModules();
    });

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
        const [pkg, params] = await setupWithAttachment(mockAttachment);
        const alias: undefined = params;
        const attachmentData: number = pkg.getAttachmentData("mock");

        expect(alias).toBeUndefined();
        expect(attachmentData).toEqual(3);
    });

    test(`creates rule with params and with attachments`, async () => {
        const [pkg, params] = await setupWithAttachment(mockAttachment, "params");
        const alias: string = params;
        const attachmentData: number = pkg.getAttachmentData("mock");

        expect(alias).toEqual("params");
        expect(attachmentData).toEqual(3);
    });
});
