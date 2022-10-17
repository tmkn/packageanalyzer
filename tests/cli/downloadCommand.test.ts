import { cli } from "../../src/cli/cli";
import { createMockDownloadServer, IMockServer, createMockNpmServer } from "../server";
import { DownloadCommand } from "../../src/cli/downloadCommand";
import { createMockContext } from "../common";
import { OnlinePackageProvider } from "../../src/providers/online";

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
