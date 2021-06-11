import { PassThrough } from "stream";

import { BaseContext } from "clipanion";

import { cli } from "../../src/cli";
import { createMockDownloadServer, IMockServer } from "../server";
import { DownloadCommand } from "../../src/cli/downloadCommand";
import { TestWritable } from "../common";

describe(`Download Command`, () => {
    const stdout = new TestWritable();
    const mockContext: BaseContext = {
        stdin: process.stdin,
        stdout: stdout,
        stderr: new PassThrough()
    };

    let server: IMockServer;

    beforeAll(async () => {
        server = await createMockDownloadServer();
    });

    test(`--package`, async () => {
        const command = cli.process([`downloads`, `--package`, `react`]);

        expect.assertions(1);
        command.context = mockContext;
        DownloadCommand.DownloadUrl = `http://localhost:${server.port}/`;

        await command.execute();

        const [line] = stdout.lines;
        expect(line).toContain(`8609192`);
    });

    afterAll(() => server.close());
});
