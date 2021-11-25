"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const cli_1 = require("../../src/cli/cli");
const server_1 = require("../server");
const downloadCommand_1 = require("../../src/cli/downloadCommand");
const common_1 = require("../common");
const online_1 = require("../../src/providers/online");
describe(`Download Command`, () => {
    const stdout = new common_1.TestWritable();
    const mockContext = {
        stdin: process.stdin,
        stdout: stdout,
        stderr: new stream_1.PassThrough()
    };
    let downloadServer;
    let npmServer;
    beforeAll(async () => {
        downloadServer = await (0, server_1.createMockDownloadServer)();
        npmServer = await (0, server_1.createMockNpmServer)();
    });
    test(`--package`, async () => {
        const command = cli_1.cli.process([`downloads`, `--package`, `react`]);
        expect.assertions(1);
        command.context = mockContext;
        downloadCommand_1.DownloadCommand.DownloadUrl = `http://localhost:${downloadServer.port}/`;
        downloadCommand_1.DownloadCommand.PackageProvider = new online_1.OnlinePackageProvider(`http://localhost:${npmServer.port}`);
        await command.execute();
        expect(stdout.lines).toMatchSnapshot();
    });
    afterAll(async () => {
        await downloadServer.close();
        await npmServer.close();
    });
});
//# sourceMappingURL=downloadCommand.test.js.map