"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs_1 = require("fs");
const stream_1 = require("stream");
const cli_1 = require("../../src/cli/cli");
const server_1 = require("../server");
const dependencyDumpCommand_1 = require("../../src/cli/dependencyDumpCommand");
const common_1 = require("../common");
describe(`Dependency Dumper`, () => {
    let server;
    const outputFolder = path.join(process.cwd(), `tmp`, `dump`);
    beforeAll(async () => {
        server = await (0, server_1.createMockNpmServer)();
    });
    test(`works`, async () => {
        const command = cli_1.cli.process([
            `dependencydump`,
            `--package`,
            `react@16.8.1`,
            `--folder`,
            outputFolder,
            `--registry`,
            `http://localhost:${server.port}`
        ]);
        expect(command).toBeInstanceOf(dependencyDumpCommand_1.DependencyDumperCommand);
        await fs_1.promises.rm(outputFolder, { recursive: true, force: true });
        await expect(fs_1.promises.readdir(outputFolder)).rejects.toThrow();
        const stderr = new common_1.TestWritable();
        command.context = {
            stdin: process.stdin,
            stdout: new stream_1.PassThrough(),
            stderr: stderr
        };
        await command.execute();
        const folder = await fs_1.promises.readdir(outputFolder);
        expect(folder.length).toEqual(7);
        expect(stderr.lines.length).toEqual(0);
    });
    test(`fails on dumping`, async () => {
        const command = cli_1.cli.process([
            `dependencydump`,
            `--package`,
            `react@16.8.1`,
            `--folder`,
            outputFolder,
            `--registry`,
            `http://unknown:${server.port}`
        ]);
        expect(command).toBeInstanceOf(dependencyDumpCommand_1.DependencyDumperCommand);
        await fs_1.promises.rm(outputFolder, { recursive: true, force: true });
        await expect(fs_1.promises.readdir(outputFolder)).rejects.toThrow();
        const stderr = new common_1.TestWritable();
        command.context = {
            stdin: process.stdin,
            stdout: new stream_1.PassThrough(),
            stderr: stderr
        };
        await command.execute();
        expect(stderr.lines.length).toBeGreaterThan(0);
    }, 10000);
    test(`fails on undefined --package`, async () => {
        const command = cli_1.cli.process([
            `dependencydump`,
            `--package`,
            `react@16.8.1`,
            `--folder`,
            outputFolder,
            `--registry`,
            `http://localhost:${server.port}`
        ]);
        expect(command).toBeInstanceOf(dependencyDumpCommand_1.DependencyDumperCommand);
        await fs_1.promises.rm(outputFolder, { recursive: true, force: true });
        await expect(fs_1.promises.readdir(outputFolder)).rejects.toThrow();
        const stderr = new common_1.TestWritable();
        command.context = {
            stdin: process.stdin,
            stdout: new stream_1.PassThrough(),
            stderr: stderr
        };
        command.package = undefined;
        await command.execute();
        expect(stderr.lines.length).toBeGreaterThan(0);
    });
    afterAll(() => server.close());
});
//# sourceMappingURL=dependencyDumperCommand.test.js.map