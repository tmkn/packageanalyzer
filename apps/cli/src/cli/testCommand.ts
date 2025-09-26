/* istanbul ignore file */
// Used to quickly try out wip things in the context of the CLI

import { z } from "zod";
import { Option } from "clipanion";
import { diffChars, createPatch, diffLines } from "diff";
import chalk from "chalk";
import { ESLint } from "eslint";
import module from "node:module";

import { CliCommand } from "./common.js";
import {
    AbstractReport,
    type IReportConfig,
    type IReportContext
} from "../../../../packages/shared/src/reports/Report.js";
import { getPackageVersionfromString } from "../../../../packages/shared/src/visitors/visitor.js";
import {
    createTarAttachment,
    type ITarData
} from "../../../../packages/node/src/attachments/TarAttachment.js";
import { type IPackage } from "../../../../packages/shared/src/package/package.js";

export class TestCommand extends CliCommand<TestReport> {
    public from = Option.String(`--from`, `react-dom@18.3.1`);
    public to = Option.String(`--to`, `react-dom`);

    static override readonly paths = [[`test`]];

    getReports(): TestReport {
        return new TestReport({
            from: this.from,
            to: this.to
        });
    }
}

const TestReportParams = z.object({
    from: z.string(),
    to: z.string()
});

export type ITestReportParams = z.infer<typeof TestReportParams>;

export class TestReport extends AbstractReport<ITestReportParams> {
    name = `Test Report`;
    configs: [IReportConfig, IReportConfig];

    constructor(params: ITestReportParams) {
        super(params);

        if (this._isPackageParams(params)) {
            this.configs = [
                {
                    pkg: getPackageVersionfromString(params.from),
                    attachments: { tar: createTarAttachment() }
                },
                {
                    pkg: getPackageVersionfromString(params.to),
                    attachments: { tar: createTarAttachment() }
                }
            ];
        } else {
            throw new Error(`Error`);
        }
    }

    async report(
        [pkg, pkg2]: [IPackage<{ tar: ITarData }>, IPackage<{ tar: ITarData }>],
        { stdoutFormatter }: IReportContext
    ): Promise<void> {
        const tarball = pkg.getAttachmentData(`tar`);
        const tarball2 = pkg2.getAttachmentData(`tar`);

        const pkgJson = tarball.files.get(`package/package.json`);
        const pkgJson2 = tarball2.files.get(`package/package.json`);

        if (pkgJson && pkgJson2) {
            // const diff = createPatch(`package.json`, pkgJson, pkgJson2);
            const diff = diffLines(pkgJson, pkgJson2);

            diff.forEach(part => {
                // Green for additions, red for deletions, grey for unchanged
                const color = part.added ? chalk.green : part.removed ? chalk.red : chalk.gray;
                process.stdout.write(color(part.value));
            });

            // console.log(diff);
            console.log();
        }

        const jsFiles = new Map(
            Array.from(tarball.files.entries()).filter(([filename]) => filename.endsWith(`.js`))
        );
        // const jsFiles: Map<string, string> = new Map([
        //     [`foo.js`, `import fs from 'fs';\nconsole.log('hello');`]
        // ]);
        const jsFiles2 = new Map(
            Array.from(tarball2.files.entries()).filter(([filename]) => filename.endsWith(`.js`))
        );

        const results = await lintInMemoryFiles(jsFiles);

        for (const result of results) {
            if (result.errorCount > 0) {
                const foo = result.messages.map(m => m.ruleId).join(`,`);

                console.log(`${foo}Found restricted imports in ${result.filePath}`);
                for (const msg of result.messages) {
                    console.log(
                        `  Line ${msg.line}, Column ${msg.column}: ${msg.message} (${msg.ruleId})`
                    );
                }
            }
        }

        console.log(`from: ${pkg.fullName}`);
        console.log(`to: ${pkg2.fullName}`);
    }

    private _isPackageParams(data: unknown): data is z.infer<typeof TestReportParams> {
        return TestReportParams.safeParse(data).success;
    }

    override validate(): z.ZodType<ITestReportParams> {
        return TestReportParams;
    }
}

async function lintInMemoryFiles(files: Map<string, string>) {
    const restrictedModules = module.builtinModules;
    const eslint = new ESLint({
        overrideConfigFile: true,
        cache: false,
        allowInlineConfig: false,

        overrideConfig: [
            {
                plugins: {},
                rules: {}
            },
            {
                plugins: {},
                files: ["**/*.js", "**/*.mjs"],

                languageOptions: {
                    ecmaVersion: "latest",
                    sourceType: "module"
                },
                rules: {
                    "no-restricted-imports": ["error", { paths: [...restrictedModules] }],
                    "no-restricted-modules": ["error", { paths: [...restrictedModules] }]
                }
            }
        ]
    });

    // This part of the logic remains correct
    const results = [];
    for (const [filename, code] of files) {
        const lintResults = await eslint.lintText(code, { filePath: filename });
        results.push(...lintResults);
    }
    return results;
}
