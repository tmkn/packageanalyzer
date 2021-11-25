"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const cli_1 = require("../../src/cli/cli");
const online_1 = require("../../src/providers/online");
const server_1 = require("../server");
const common_1 = require("../common");
describe(`Update Info Command`, () => {
    const stdout = new common_1.TestWritable();
    const mockContext = {
        stdin: process.stdin,
        stdout,
        stderr: new stream_1.PassThrough()
    };
    let server;
    let provider;
    beforeAll(async () => {
        server = await (0, server_1.createMockNpmServer)();
        provider = new online_1.OnlinePackageProvider(`http://localhost:${server.port}`);
        jest.setSystemTime(new Date(`2021-10-26`).getTime());
    });
    test(`--package`, async () => {
        const command = cli_1.cli.process([`update`, `--package`, `react@16.8.1`]);
        expect.assertions(1);
        command.context = mockContext;
        await command.execute();
        expect(stdout.lines).toMatchSnapshot();
    });
    afterAll(() => {
        jest.useRealTimers();
        return server.close();
    });
});
//# sourceMappingURL=updateInfoCommand.test.js.map