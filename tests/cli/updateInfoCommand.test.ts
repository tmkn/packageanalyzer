import { PassThrough } from "stream";

import { BaseContext } from "clipanion";

import { cli } from "../../src/cli/cli";
import { OnlinePackageProvider } from "../../src/providers/online";
import { createMockNpmServer, IMockServer } from "../server";
import { TestWritable } from "../common";

describe(`Update Info Command`, () => {
    const stdout = new TestWritable();

    const mockContext: BaseContext = {
        stdin: process.stdin,
        stdout,
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

        expect.assertions(1);
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
    });

    afterAll(() => server.close());
});
