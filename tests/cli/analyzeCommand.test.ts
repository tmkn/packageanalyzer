import * as path from "path";
import { PassThrough } from "stream";

import { BaseContext } from "clipanion";

import { cli } from "../../src/cli/cli";
import { OnlinePackageProvider } from "../../src/providers/online";
import { createMockNpmServer, IMockServer } from "../server";
import { TestWritable } from "../common";

describe(`Analyze Command`, () => {
    const mockContext: BaseContext = {
        stdin: process.stdin,
        stdout: new PassThrough(),
        stderr: new PassThrough()
    };

    let server: IMockServer;
    let provider: OnlinePackageProvider;

    beforeAll(async () => {
        server = await createMockNpmServer();
        provider = new OnlinePackageProvider(`http://localhost:${server.port}`);

        jest.setSystemTime(new Date(`2021-10-26`).getTime());
    });

    test(`--package --type --full`, async () => {
        const stdout = new TestWritable();
        const command = cli.process([
            `analyze`,
            `--package`,
            `react@16.8.1`,
            `--type`,
            `dependencies`,
            `--full`
        ]);

        expect.assertions(1);
        command.context = mockContext;
        mockContext.stdout = stdout;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
    });

    test(`--package --type`, async () => {
        const stdout = new TestWritable();
        const command = cli.process([
            `analyze`,
            `--package`,
            `react@16.8.1`,
            `--type`,
            `dependencies`
        ]);

        expect.assertions(1);
        command.context = mockContext;
        mockContext.stdout = stdout;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
    });

    test(`--folder --type --full`, async () => {
        const stdout = new TestWritable();
        const command = cli.process([
            `analyze`,
            `--folder`,
            path.join("tests", "data", "testproject1"),
            `--type`,
            `dependencies`,
            `--full`
        ]);

        expect.assertions(1);
        command.context = mockContext;
        mockContext.stdout = stdout;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
    });

    afterAll(() => {
        jest.useRealTimers();

        return server.close();
    });
});
