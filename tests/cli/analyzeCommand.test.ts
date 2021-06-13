import * as path from "path";
import { PassThrough } from "stream";

import { BaseContext } from "clipanion";

import { cli } from "../../src/cli";
import { OnlinePackageProvider } from "../../src/providers/online";
import { createMockNpmServer, IMockServer } from "../server";

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
    });

    test(`--package --type --full`, async () => {
        const command = cli.process([
            `analyze`,
            `--package`,
            `react@16.8.1`,
            `--type`,
            `dependencies`,
            `--full`
        ]);

        expect.assertions(0);
        command.context = mockContext;
        await command.execute();
    });

    test(`--package --type`, async () => {
        const command = cli.process([
            `analyze`,
            `--package`,
            `react@16.8.1`,
            `--type`,
            `dependencies`
        ]);

        expect.assertions(0);
        command.context = mockContext;
        await command.execute();
    });

    test(`--folder --type --full`, async () => {
        const command = cli.process([
            `analyze`,
            `--folder`,
            path.join("tests", "data", "testproject1"),
            `--type`,
            `dependencies`,
            `--full`
        ]);

        expect.assertions(0);
        command.context = mockContext;

        await command.execute();
    });

    afterAll(() => server.close());
});
