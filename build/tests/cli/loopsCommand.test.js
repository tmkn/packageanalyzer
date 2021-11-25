"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const stream_1 = require("stream");
const cli_1 = require("../../src/cli/cli");
const folder_1 = require("../../src/providers/folder");
const common_1 = require("../common");
const loopsCommand_1 = require("../../src/cli/loopsCommand");
describe(`Loops Command`, () => {
    const stdout = new common_1.TestWritable();
    const mockContext = {
        stdin: process.stdin,
        stdout,
        stderr: new stream_1.PassThrough()
    };
    test(`--package --type`, async () => {
        const command = cli_1.cli.process([
            `loops`,
            `--package`,
            `testproject2@1.0.0`,
            `--type`,
            `dependencies`
        ]);
        const rootPath = path.join("tests", "data", "testproject2");
        const provider = new folder_1.FileSystemPackageProvider(rootPath);
        expect.assertions(1);
        command.context = mockContext;
        loopsCommand_1.LoopsCommand.PackageProvider = provider;
        await command.execute();
        expect(stdout.lines).toMatchSnapshot();
    });
});
//# sourceMappingURL=loopsCommand.test.js.map