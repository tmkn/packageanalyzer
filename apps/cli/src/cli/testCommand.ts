/* istanbul ignore file */
// Used to quickly try out wip things in the context of the CLI

import { z } from "zod";
import { Option } from "clipanion";
import { diffChars, createPatch, diffLines } from "diff";
import chalk from "chalk";

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
    public from = Option.String(`--from`, `react@18.3.1`);
    public to = Option.String(`--to`, `react`);

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
