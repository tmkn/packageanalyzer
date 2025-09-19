import path from "path";
import fs from "fs";
import { spawnSync } from "child_process";
import { describe, test, expect, beforeAll } from "vitest";

import { CliCommand } from "../../src/cli/common.js";
import { AbstractReport } from "../../../../packages/shared/src/reports/Report.js";
import { isValidDependencyType } from "../../../../packages/shared/src/reports/Validation.js";
import { createMockContext, TestReport } from "../../../../packages/test-utils/src/common.js";
import { MockProvider, type IMockPackageJson } from "../../../../packages/test-utils/src/mocks.js";

describe(`CLI Utility`, () => {
    test(`isValidDependencyType`, () => {
        expect(isValidDependencyType("dependencies")).toEqual(true);
        expect(isValidDependencyType("devDependencies")).toEqual(true);
        expect(isValidDependencyType("abc")).toEqual(false);
        expect(isValidDependencyType(3)).toEqual(false);
    });
});

describe(`CliCommand Tests`, () => {
    test(`Correctly writes to stderr on exception`, async () => {
        const { command, stdout, stderr } = createMockCliCommand(() => {
            throw new Error(`Whoops`);
        });

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    describe(`getReports`, () => {
        test(`returns a single report`, async () => {
            expect.assertions(3);

            const { command } = createMockCliCommand(() => {
                const report = createReport(async packages => {
                    expect(packages).toHaveLength(1);
                    expect(packages[0].name).toEqual(packageJson.name);
                    expect(packages[0].version).toEqual(packageJson.version);
                });

                return report;
            });

            await command.execute();
        });

        test(`async returns a single report`, async () => {
            expect.assertions(3);

            const { command } = createMockCliCommand(async () => {
                const report = createReport(async packages => {
                    expect(packages).toHaveLength(1);
                    expect(packages[0].name).toEqual(packageJson.name);
                    expect(packages[0].version).toEqual(packageJson.version);
                });

                return report;
            });

            await command.execute();
        });

        test(`returns multiple reports`, async () => {
            expect.assertions(6);

            const { command } = createMockCliCommand(() => {
                const report1 = createReport(async packages => {
                    expect(packages).toHaveLength(1);
                    expect(packages[0].name).toEqual(packageJson.name);
                    expect(packages[0].version).toEqual(packageJson.version);
                });

                const report2 = createReport(async packages => {
                    expect(packages).toHaveLength(1);
                    expect(packages[0].name).toEqual(packageJson.name);
                    expect(packages[0].version).toEqual(packageJson.version);
                });

                return [report1, report2];
            });

            await command.execute();
        });

        test(`async returns multiple reports`, async () => {
            expect.assertions(6);

            const { command } = createMockCliCommand(async () => {
                const report1 = createReport(async packages => {
                    expect(packages).toHaveLength(1);
                    expect(packages[0].name).toEqual(packageJson.name);
                    expect(packages[0].version).toEqual(packageJson.version);
                });

                const report2 = createReport(async packages => {
                    expect(packages).toHaveLength(1);
                    expect(packages[0].name).toEqual(packageJson.name);
                    expect(packages[0].version).toEqual(packageJson.version);
                });

                return [report1, report2];
            });

            await command.execute();
        });
    });
});

describe(`version`, () => {
    const cwd = process.cwd();
    const pkgJson = path.join(cwd, "package.json");
    const { version } = JSON.parse(fs.readFileSync(pkgJson, "utf-8"));
    const cliPath = path.join("dist", "cli.js");

    beforeAll(() => {
        const resolvedCliPath = path.resolve(cwd, cliPath);

        if (!fs.existsSync(resolvedCliPath)) {
            throw new Error(`Tests require dist files (cli.js). Please run the 'build' command.`);
        }
    });

    test(`returns version`, async () => {
        const { stdout } = spawnSync("node", [cliPath, "--version"], {
            encoding: "utf-8",
            stdio: "pipe",
            cwd
        });

        expect(stdout).toEqual(version + "\n");
    });
});

type ReportReturnType = AbstractReport<any> | AbstractReport<any>[];

interface MockCliCommandParams {
    getReports?: () => ReportReturnType | Promise<ReportReturnType>;
}

class MockCliCommand extends CliCommand<ReportReturnType> {
    constructor(private _params: MockCliCommandParams) {
        super();

        if (this._params.getReports) {
            this.getReports = this._params.getReports;
        }
    }

    getReports(): ReportReturnType | Promise<ReportReturnType> {
        throw new Error(`getReports method not implemented`);
    }
}

const packageJson: IMockPackageJson = { name: `mockpackage`, version: `1.2.3` };
const provider: MockProvider = new MockProvider([packageJson]);

function createMockCliCommand(getReports: MockCliCommandParams["getReports"]) {
    const command = new MockCliCommand({
        getReports
    });
    const { mockContext, ...rest } = createMockContext();
    command.context = mockContext;

    return { command, ...rest };
}

function createReport(reportFn: AbstractReport<any>["report"]): AbstractReport<any> {
    const report = new TestReport({
        pkg: [packageJson.name!, packageJson.version],
        report: async (...args) => reportFn(...args)
    });

    report.provider = provider;

    return report;
}
