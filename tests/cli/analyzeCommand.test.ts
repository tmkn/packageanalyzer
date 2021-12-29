import * as path from "path";

import { cli } from "../../src/cli/cli";
import { OnlinePackageProvider } from "../../src/providers/online";
import { createMockNpmServer, IMockServer } from "../server";
import { createMockContext } from "../common";
import { AnalyzeCommand } from "../../src/cli/analyzeCommand";

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

        expect.assertions(1);
        const { mockContext, stdout } = createMockContext();
        command.context = mockContext;
        command.beforeProcess = report => (report.provider = provider);

        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
    });

    test(`--package --type`, async () => {
        const command = cli.process([
            `analyze`,
            `--package`,
            `react@16.8.1`,
            `--type`,
            `dependencies`
        ]) as AnalyzeCommand;

        expect.assertions(1);
        const { mockContext, stdout } = createMockContext();
        command.context = mockContext;
        command.beforeProcess = report => (report.provider = provider);

        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
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

        expect.assertions(1);
        const { mockContext, stdout } = createMockContext();
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
    });

    afterAll(() => {
        jest.useRealTimers();

        return server.close();
    });
});
