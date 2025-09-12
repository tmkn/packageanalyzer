import { describe, test, expect, beforeAll, afterAll } from "vitest";

import { cli } from "../../src/cli/cli.js";
import { createMockDownloadServer, type IMockServer, createMockNpmServer } from "../server.js";
import { DownloadCommand } from "../../src/cli/downloadCommand.js";
import { createMockContext } from "../common.js";
import { OnlinePackageProvider } from "../../src/providers/online.js";

describe(`Download Command`, () => {
    let downloadServer: IMockServer;
    let npmServer: IMockServer;

    beforeAll(async () => {
        downloadServer = await createMockDownloadServer();
        npmServer = await createMockNpmServer();
    });

    test(`--package`, async () => {
        const command = cli.process([`downloads`, `--package`, `react`]) as DownloadCommand;
        const { mockContext, stdout, stderr } = createMockContext();

        expect.assertions(2);
        command.context = mockContext;
        command.beforeProcess = report =>
            (report.provider = new OnlinePackageProvider(`http://localhost:${npmServer.port}`));
        DownloadCommand.DownloadUrl = `http://localhost:${downloadServer.port}/`;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    afterAll(async () => {
        await downloadServer.close();
        await npmServer.close();
    });
});
