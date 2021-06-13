import { PassThrough } from "stream";

import { BaseContext } from "clipanion";

import { cli } from "../../src/cli";
import { OnlinePackageProvider } from "../../src/providers/online";
import { createMockNpmServer, IMockServer } from "../server";

describe(`Update Info Command`, () => {
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

    test(`--package`, async () => {
        const command = cli.process([`update`, `--package`, `react@16.8.1`]);

        expect.assertions(0);
        command.context = mockContext;

        await command.execute();
    });

    afterAll(() => server.close());
});
