import * as path from "path";
import { promises as fs } from "fs";
import { PassThrough } from "stream";

import { cli } from "../../src/cli";
import { createMockNpmServer, MockNpmServer } from "../server";
import { DependencyDumperCommand } from "../../src/cli/dependencyDumpCommand";
import { TestWritable } from "../common";

describe(`Dependency Dumper`, () => {
    let server: MockNpmServer;
    const outputFolder = path.join(process.cwd(), `tmp`, `dump`);

    beforeAll(async () => {
        server = await createMockNpmServer();
    });

    test(`works`, async () => {
        const command = cli.process([
            `dependencydump`,
            `--package`,
            `react@16.8.1`,
            `--folder`,
            outputFolder,
            `--registry`,
            `http://localhost:${server.port}`
        ]);

        expect(command).toBeInstanceOf(DependencyDumperCommand);

        await fs.rm(outputFolder, { recursive: true, force: true });
        await expect(fs.readdir(outputFolder)).rejects.toThrow();

        const stderr = new TestWritable();
        command.context = {
            stdin: process.stdin,
            stdout: new PassThrough(),
            stderr: stderr
        };
        await command.execute();

        const folder = await fs.readdir(outputFolder);
        expect(folder.length).toEqual(7);
        expect(stderr.lines.length).toEqual(0);
    });

    test(`fails on dumping`, async () => {
        const command = cli.process([
            `dependencydump`,
            `--package`,
            `react@16.8.1`,
            `--folder`,
            outputFolder,
            `--registry`,
            `http://unknown:${server.port}`
        ]);

        expect(command).toBeInstanceOf(DependencyDumperCommand);

        await fs.rm(outputFolder, { recursive: true, force: true });
        await expect(fs.readdir(outputFolder)).rejects.toThrow();

        const stderr = new TestWritable();
        command.context = {
            stdin: process.stdin,
            stdout: new PassThrough(),
            stderr: stderr
        };
        await command.execute();

        expect(stderr.lines.length).toBeGreaterThan(0);
    }, 10000);

    test(`fails on undefined --package`, async () => {
        const command = cli.process([
            `dependencydump`,
            `--package`,
            `react@16.8.1`,
            `--folder`,
            outputFolder,
            `--registry`,
            `http://localhost:${server.port}`
        ]);

        expect(command).toBeInstanceOf(DependencyDumperCommand);

        await fs.rm(outputFolder, { recursive: true, force: true });
        await expect(fs.readdir(outputFolder)).rejects.toThrow();

        const stderr = new TestWritable();
        command.context = {
            stdin: process.stdin,
            stdout: new PassThrough(),
            stderr: stderr
        };
        (command as any).package = undefined;
        await command.execute();

        expect(stderr.lines.length).toBeGreaterThan(0);
    });

    afterAll(() => server.close());
});
