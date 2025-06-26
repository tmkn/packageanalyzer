import * as path from "path";
import { spawnSync } from "child_process";

import { cli } from "../../src/cli/cli.js";
import { LintCommand } from "../../src/cli/lintCommand.js";
import { createMockContext } from "../common.js";
import { type IMockPackageJson, MockProvider } from "../mocks.js";
import { pathToFileURL } from "url";

describe(`Lint Command`, () => {
    const medalloPkg: IMockPackageJson = {
        name: `medallo`,
        version: `1.0.0`,
        dependencies: [
            { name: `foo`, version: `1.0.0` },
            { name: `bar`, version: `1.0.0` }
        ]
    };
    const provider = new MockProvider([medalloPkg]);

    describe(`Error Handling`, () => {
        test(`fails on missing lint file`, async () => {
            const command = cli.process([
                `lint`,
                `--package`,
                `foo`,
                `./tests/mocks/lint/missing.js`
            ]) as LintCommand;

            expect.assertions(3);
            const { mockContext, stdout, stderr } = createMockContext();
            command.context = mockContext;

            await command.execute();

            expect(stdout.lines.length).toBe(0);
            expect(stderr.lines.length).toBe(2);
            expect(stderr.lines[0]).toContain(`Error:`);
        });

        test(`fails on invalid lint file format`, async () => {
            const command = cli.process([
                `lint`,
                `--package`,
                `foo`,
                path.join(process.cwd(), `tests`, `sampleReport.js`)
            ]) as LintCommand;

            expect.assertions(3);
            const { mockContext, stdout, stderr } = createMockContext();
            command.context = mockContext;

            await command.execute();

            expect(stdout.lines.length).toBe(0);
            expect(stderr.lines.length).toBe(2);
            expect(stderr.lines[0]).toContain(`Error:`);
        });

        test(`fails on missing --package and --folder`, async () => {
            const command = cli.process([
                `lint`,
                path.join(process.cwd(), `tests`, `sampleReport.js`)
            ]) as LintCommand;

            expect.assertions(2);
            const { mockContext, stdout, stderr } = createMockContext();
            command.context = mockContext;

            await command.execute();

            expect(stdout.lines).toMatchSnapshot(`stdout`);
            expect(stderr.lines).toMatchSnapshot(`stderr`);
        });

        test(`shows error message for invalid check return value`, async () => {
            const packageJsonPath = path.join(process.cwd(), "tests", "data", "lint_data");
            const lintFilePath = path.join(
                process.cwd(),
                "tests",
                "data",
                "lint_data",
                "lintFileInvalidCheck.js"
            );

            const command = cli.process([
                `lint`,
                `--folder`,
                packageJsonPath,
                lintFilePath
            ]) as LintCommand;

            expect.assertions(2);
            const { mockContext, stdout, stderr } = createMockContext();
            command.context = mockContext;

            await command.execute();

            expect(stdout.lines).toMatchSnapshot(`stdout`);
            expect(stderr.lines).toMatchSnapshot(`stderr`);
        });
    });

    describe(`--package`, () => {
        test(`correctly shows success message`, async () => {
            const command = cli.process([
                `lint`,
                `--package`,
                `medallo@1.0.0`,
                path.join(process.cwd(), `tests`, `sampleLintFileEmpty.js`)
            ]) as LintCommand;

            expect.assertions(2);
            const { mockContext, stdout, stderr } = createMockContext();
            command.context = mockContext;
            command.beforeProcess = report => (report.provider = provider);

            await command.execute();

            expect(stdout.lines).toMatchSnapshot(`stdout`);
            expect(stderr.lines).toMatchSnapshot(`stderr`);
        });

        test(`correctly reports all packages in the tree`, async () => {
            const command = cli.process([
                `lint`,
                `--package`,
                `medallo@1.0.0`,
                path.join(process.cwd(), `tests`, `sampleLintFileNonEmpty.js`)
            ]) as LintCommand;

            expect.assertions(2);
            const { mockContext, stdout, stderr } = createMockContext();
            command.context = mockContext;
            command.beforeProcess = report => (report.provider = provider);

            await command.execute();

            expect(stdout.lines).toMatchSnapshot(`stdout`);
            expect(stderr.lines).toMatchSnapshot(`stderr`);
        });
    });

    describe(`--folder`, () => {
        test(`correctly shows success message`, async () => {
            const packageJsonPath = path.join(process.cwd(), "tests", "data", "lint_data");
            const lintFilePath = path.join(
                process.cwd(),
                "tests",
                "data",
                "lint_data",
                "lintFile.js"
            );

            const command = cli.process([
                `lint`,
                `--folder`,
                packageJsonPath,
                lintFilePath
            ]) as LintCommand;

            expect.assertions(2);
            const { mockContext, stdout, stderr } = createMockContext();
            command.context = mockContext;

            await command.execute();

            expect(stdout.lines).toMatchSnapshot(`stdout`);
            expect(stderr.lines).toMatchSnapshot(`stderr`);
        });

        test(`correctly reports all packages as warnings`, async () => {
            const packageJsonPath = path.join(process.cwd(), "tests", "data", "lint_data");
            const lintFilePath = path.join(
                process.cwd(),
                "tests",
                "data",
                "lint_data",
                "allWarningLintFile.js"
            );

            const command = cli.process([
                `lint`,
                `--folder`,
                packageJsonPath,
                lintFilePath
            ]) as LintCommand;

            expect.assertions(2);
            const { mockContext, stdout, stderr } = createMockContext();
            command.context = mockContext;

            await command.execute();

            expect(stdout.lines).toMatchSnapshot(`stdout`);
            expect(stderr.lines).toMatchSnapshot(`stderr`);
        });

        test(`correctly reports all packages as errors`, async () => {
            const packageJsonPath = path.join(process.cwd(), "tests", "data", "lint_data");
            const lintFilePath = path.join(
                process.cwd(),
                "tests",
                "data",
                "lint_data",
                "allErrorLintFile.js"
            );

            const command = cli.process([
                `lint`,
                `--folder`,
                packageJsonPath,
                lintFilePath
            ]) as LintCommand;

            expect.assertions(2);
            const { mockContext, stdout, stderr } = createMockContext();
            command.context = mockContext;

            await command.execute();

            expect(stdout.lines).toMatchSnapshot(`stdout`);
            expect(stderr.lines).toMatchSnapshot(`stderr`);
        });
    });

    describe(`--depth`, () => {
        test(`--depth: 0  | correctly reports only root package in the tree`, async () => {
            const command = cli.process([
                `lint`,
                `--depth`,
                `0`,
                `--package`,
                `medallo@1.0.0`,
                path.join(process.cwd(), `tests`, `sampleLintFileNonEmpty.js`)
            ]) as LintCommand;

            expect.assertions(2);
            const { mockContext, stdout, stderr } = createMockContext();
            command.context = mockContext;
            command.beforeProcess = report => (report.provider = provider);

            await command.execute();

            expect(stdout.lines).toMatchSnapshot(`stdout`);
            expect(stderr.lines).toMatchSnapshot(`stderr`);
        });

        test(`--depth: invalid  | correctly falls back to "Infinity" when depth is not valid`, async () => {
            const command = cli.process([
                `lint`,
                `--depth`,
                `invalid`,
                `--package`,
                `medallo@1.0.0`,
                path.join(process.cwd(), `tests`, `sampleLintFileNonEmpty.js`)
            ]) as LintCommand;

            expect.assertions(2);
            const { mockContext, stdout, stderr } = createMockContext();
            command.context = mockContext;
            command.beforeProcess = report => (report.provider = provider);

            await command.execute();

            expect(stdout.lines).toMatchSnapshot(`stdout`);
            expect(stderr.lines).toMatchSnapshot(`stderr`);
        });
    });

    describe(`exit codes`, () => {
        test(`returns 1 when reports are all 'error'`, async () => {
            const cwd = path.join(__dirname, "..", "..");
            const cliPath = path.join("build", "src", "cli.js");
            const packageJsonPath = path.join("tests", "data", "lint_data");
            const lintFilePath = pathToFileURL(
                path.join("tests", "data", "lint_data", "allErrorLintFile.js")
            ).href;
            const { status, stdout, stderr } = spawnSync(
                "node",
                [cliPath, "lint", "--folder", packageJsonPath, lintFilePath],
                {
                    encoding: "utf-8",
                    stdio: "pipe",
                    cwd
                }
            );

            expect(status).toBe(1);
        });

        test(`returns 1 when reports are mixed ('error' & 'warning')`, async () => {
            const cwd = path.join(__dirname, "..", "..");
            const cliPath = path.join("build", "src", "cli.js");
            const packageJsonPath = path.join("tests", "data", "lint_data");
            const lintFilePath = pathToFileURL(
                path.join("tests", "data", "lint_data", "allMixedLintFile.js")
            ).href;
            const { status, stdout, stderr } = spawnSync(
                "node",
                [cliPath, "lint", "--folder", packageJsonPath, lintFilePath],
                {
                    encoding: "utf-8",
                    stdio: "pipe",
                    cwd
                }
            );

            expect(status).toBe(1);
        });

        test(`returns 0 when reports are all 'warning'`, async () => {
            const cwd = path.join(__dirname, "..", "..");
            const cliPath = path.join("build", "src", "cli.js");
            const packageJsonPath = path.join(cwd, "tests", "data", "lint_data");
            const lintFilePath = pathToFileURL(
                path.join("tests", "data", "lint_data", "allWarningLintFile.js")
            ).href;
            const { status, stdout, stderr } = spawnSync(
                "node",
                [cliPath, "lint", "--folder", packageJsonPath, lintFilePath],
                {
                    encoding: "utf-8",
                    stdio: "pipe",
                    cwd
                }
            );

            expect(status).toBe(0);
        });
    });
});
