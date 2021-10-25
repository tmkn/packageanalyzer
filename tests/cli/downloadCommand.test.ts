import { PassThrough } from "stream";

import { BaseContext } from "clipanion";

import { cli } from "../../src/cli/cli";
import { createMockDownloadServer, IMockServer, createMockNpmServer } from "../server";
import { DownloadCommand } from "../../src/cli/downloadCommand";
import { TestWritable } from "../common";
import { OnlinePackageProvider } from "../../src/providers/online";

describe(`Download Command`, () => {
    const stdout = new TestWritable();
    const mockContext: BaseContext = {
        stdin: process.stdin,
        stdout: stdout,
        stderr: new PassThrough()
    };

    let downloadServer: IMockServer;
    let npmServer: IMockServer;

    beforeAll(async () => {
        downloadServer = await createMockDownloadServer();
        npmServer = await createMockNpmServer();
    });

    test(`--package`, async () => {
        const command = cli.process([`downloads`, `--package`, `react`]);

        expect.assertions(1);
        command.context = mockContext;
        DownloadCommand.DownloadUrl = `http://localhost:${downloadServer.port}/`;
        DownloadCommand.PackageProvider = new OnlinePackageProvider(
            `http://localhost:${npmServer.port}`
        );

        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
    });

    afterAll(async () => {
        await downloadServer.close();
        await npmServer.close();
    });
});
