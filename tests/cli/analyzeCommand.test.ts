import * as path from "path";

import { cli } from "../../src/cli/cli";
import { OnlinePackageProvider } from "../../src/providers/online";
import { createMockNpmServer, IMockServer } from "../server";
import { createMockContext } from "../common";
import { AnalyzeCommand } from "../../src/cli/analyzeCommand";
import { DumpPackageProvider } from "../../src/providers/folder";

describe(`Analyze Command`, () => {
    let server: IMockServer;
    let provider: OnlinePackageProvider;

    beforeAll(async () => {
        server = await createMockNpmServer();
        provider = new OnlinePackageProvider(`http://localhost:${server.port}`);

        jest.setSystemTime(new Date(`2021-10-26`).getTime());
    });

    test(`--package --type --full`, async () => {
        const command = cli.process([
            `analyze`,
            `--package`,
            `react@16.8.1`,
            `--type`,
            `dependencies`,
            `--full`
        ]) as AnalyzeCommand;

        expect.assertions(2);
        const { mockContext, stdout, stderr } = createMockContext();
        command.context = mockContext;
        command.beforeProcess = report => (report.provider = provider);

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    test(`--package --type`, async () => {
        const command = cli.process([
            `analyze`,
            `--package`,
            `react@16.8.1`,
            `--type`,
            `dependencies`
        ]) as AnalyzeCommand;

        expect.assertions(2);
        const { mockContext, stdout, stderr } = createMockContext();
        command.context = mockContext;
        command.beforeProcess = report => (report.provider = provider);

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    test(`--folder --type --full`, async () => {
        const command = cli.process([
            `analyze`,
            `--folder`,
            path.join("tests", "data", "testproject1"),
            `--type`,
            `dependencies`,
            `--full`
        ]) as AnalyzeCommand;

        expect.assertions(2);
        const { mockContext, stdout, stderr } = createMockContext();
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    test(`display loops info`, async () => {
        const rootPath = path.join("tests", "data", "loops_data");
        const provider = new DumpPackageProvider(rootPath);

        const command = cli.process([
            `analyze`,
            `--package`,
            `@webassemblyjs/ast@1.9.0`,
            `--type`,
            `dependencies`,
            `--full`
        ]) as AnalyzeCommand;

        expect.assertions(2);
        const { mockContext, stdout, stderr } = createMockContext();
        command.context = mockContext;
        command.beforeProcess = report => (report.provider = provider);

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    test(`aborts on wrong --type`, async () => {
        const command = cli.process([
            `analyze`,
            `--folder`,
            path.join("tests", "data", "testproject1"),
            `--type`,
            `abc`,
            `--full`
        ]) as AnalyzeCommand;

        expect.assertions(2);
        const { mockContext, stdout, stderr } = createMockContext();
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    test(`aborts on missing --folder or --package`, async () => {
        const command = cli.process([
            `analyze`,
            `--folder`,
            path.join("tests", "data", "testproject1"),
            `--type`,
            `dependencies`,
            `--full`
        ]) as AnalyzeCommand;

        expect.assertions(2);
        const { mockContext, stdout, stderr } = createMockContext();
        command.context = mockContext;

        command.folder = undefined;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    afterAll(() => {
        jest.useRealTimers();

        return server.close();
    });
});
