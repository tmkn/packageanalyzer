import * as path from "path";
import { PassThrough } from "stream";

import { BaseContext } from "clipanion";

import { cli } from "../../src/cli";
import { OnlinePackageProvider } from "../../src/providers/online";
import { createMockNpmServer, MockNpmServer } from "../server";

describe(`Tree Command`, () => {
    const mockContext: BaseContext = {
        stdin: process.stdin,
        stdout: new PassThrough(),
        stderr: new PassThrough()
    };

    let server: MockNpmServer;
    let provider: OnlinePackageProvider;

    beforeAll(async () => {
        server = await createMockNpmServer();
        provider = new OnlinePackageProvider(`http://localhost:${server.port}`);
    });

    test(`--package --type`, async () => {
        const command = cli.process([
            `tree`,
            `--package`,
            `react@16.8.1`,
            `--type`,
            `dependencies`
        ]);

        expect.assertions(0);
        command.context = mockContext;
        await command.execute();
    });

    test(`--folder --type`, async () => {
        const command = cli.process([
            `tree`,
            `--folder`,
            path.join("tests", "data", "testproject1"),
            `--type`,
            `dependencies`
        ]);

        expect.assertions(0);
        command.context = mockContext;

        await command.execute();
    });

    afterAll(() => server.close());
});
