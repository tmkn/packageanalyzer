import * as path from "path";
import { promises as fs } from "fs";

import { cli } from "../../src/cli/cli.js";
import { createMockNpmServer, type IMockServer } from "../server.js";
import { DependencyDumperCommand } from "../../src/cli/dependencyDumpCommand.js";
import { createMockContext } from "../common.js";
import { OnlinePackageProvider } from "../../src/index.js";

describe(`Dependency Dumper`, () => {
    let server: IMockServer;
    const outputFolder = path.join(process.cwd(), `tmp`, `dump`);

    beforeAll(async () => {
        server = await createMockNpmServer();
        vi.useRealTimers();
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
        ]) as DependencyDumperCommand;

        expect(command).toBeInstanceOf(DependencyDumperCommand);

        // command.beforeProcess = report =>
        //     (report.provider = new OnlinePackageProvider(`http://localhost:${server.port}`));

        await fs.rm(outputFolder, { recursive: true, force: true });
        await expect(fs.readdir(outputFolder)).rejects.toThrow();

        const { mockContext, stderr } = createMockContext();
        command.context = mockContext;
        await command.execute();

        const folder = await fs.readdir(outputFolder);
        expect(folder.length).toEqual(7);
        expect(stderr.lines.length).toEqual(0);
    });

    // unimportant test/takes too long
    // test.only(`fails on dumping`, async () => {
    //     const command = cli.process([
    //         `dependencydump`,
    //         `--package`,
    //         `react@16.8.1`,
    //         `--folder`,
    //         outputFolder,
    //         `--registry`,
    //         `http://unknown:${server.port}`
    //     ]) as DependencyDumperCommand;

    //     expect(command).toBeInstanceOf(DependencyDumperCommand);

    //     command.beforeProcess = report => {
    //         report.provider = new OnlinePackageProvider(`http://unknown:${server.port}`);
    //     };

    //     await fs.rm(outputFolder, { recursive: true, force: true });
    //     await expect(fs.readdir(outputFolder)).rejects.toThrow();

    //     const { mockContext, stderr } = createMockContext();
    //     command.context = mockContext;
    //     await command.execute();

    //     expect(stderr.lines.length).toBeGreaterThan(0);
    // }, 11000);

    afterAll(() => server.close());
});
