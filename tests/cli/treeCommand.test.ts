import * as path from "path";
import { PassThrough } from "stream";

import { BaseContext } from "clipanion";

import { cli } from "../../src/cli/cli";
import { OnlinePackageProvider } from "../../src/providers/online";
import { createMockNpmServer, IMockServer } from "../server";
import { TestWritable } from "../common";

describe(`Tree Command`, () => {
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
    });

    test(`--package --type`, async () => {
        const stdout = new TestWritable();
        const command = cli.process([
            `tree`,
            `--package`,
            `react@16.8.1`,
            `--type`,
            `dependencies`
        ]);

        expect.assertions(1);
        mockContext.stdout = stdout;
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
    });

    test(`--folder --type`, async () => {
        const stdout = new TestWritable();
        const command = cli.process([
            `tree`,
            `--folder`,
            path.join("tests", "data", "testproject1"),
            `--type`,
            `dependencies`
        ]);

        expect.assertions(1);
        mockContext.stdout = stdout;
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
    });

    afterAll(() => server.close());
});
