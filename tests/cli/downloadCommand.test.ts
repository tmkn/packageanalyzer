import { PassThrough } from "stream";

import { BaseContext } from "clipanion";

import { cli } from "../../src/cli";
import { createServer, MockNpmServer } from "../server";

describe(`Download Command`, () => {
    const mockContext: BaseContext = {
        stdin: process.stdin,
        stdout: new PassThrough(),
        stderr: new PassThrough()
    };

    let server: MockNpmServer;

    beforeAll(async () => {
        server = await createServer();
    });

    test(`--package`, async () => {
        const command = cli.process([`downloads`, `--package`, `_download`]);

        expect.assertions(0);
        command.context = mockContext;
        //DownloadCommand.DownloadUrl = `http://localhost:${server.port}/`;

        await command.execute();
    });

    afterAll(() => server.close());
});
