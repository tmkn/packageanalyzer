"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const stream_1 = require("stream");
const cli_1 = require("../../src/cli/cli");
const online_1 = require("../../src/providers/online");
const server_1 = require("../server");
const common_1 = require("../common");
describe(`Tree Command`, () => {
    const mockContext = {
        stdin: process.stdin,
        stdout: new stream_1.PassThrough(),
        stderr: new stream_1.PassThrough()
    };
    let server;
    let provider;
    beforeAll(async () => {
        server = await (0, server_1.createMockNpmServer)();
        provider = new online_1.OnlinePackageProvider(`http://localhost:${server.port}`);
    });
    test(`--package --type`, async () => {
        const stdout = new common_1.TestWritable();
        const command = cli_1.cli.process([
            `tree`,
            `--package`,
            `react@16.8.1`,
            `--type`,
            `dependencies`
        ]);
        expect.assertions(1);
        mockContext.stdout = stdout;
        command.context = mockContext;
        await command.execute();
        expect(stdout.lines).toMatchSnapshot();
    });
    test(`--folder --type`, async () => {
        const stdout = new common_1.TestWritable();
        const command = cli_1.cli.process([
            `tree`,
            `--folder`,
            path.join("tests", "data", "testproject1"),
            `--type`,
            `dependencies`
        ]);
        expect.assertions(1);
        mockContext.stdout = stdout;
        command.context = mockContext;
        await command.execute();
        expect(stdout.lines).toMatchSnapshot();
    });
    afterAll(() => server.close());
});
//# sourceMappingURL=treeCommand.test.js.map