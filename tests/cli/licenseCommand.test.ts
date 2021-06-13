import * as path from "path";
import { PassThrough } from "stream";

import { BaseContext } from "clipanion";

import { cli } from "../../src/cli";
import { OnlinePackageProvider } from "../../src/providers/online";
import { createMockNpmServer, IMockServer } from "../server";

describe(`License Check Command`, () => {
    const mockContext: BaseContext = {
        stdin: process.stdin,
        stdout: new PassThrough(),
        stderr: new PassThrough()
    };

    let server: IMockServer;
    let provider: OnlinePackageProvider;

    beforeAll(async () => {
        server = await createMockNpmServer();
        provider = new OnlinePackageProvider(`http://localhost:${server.port}`);
    });

    test(`--package`, async () => {
        const command = cli.process([`license`, `--package`, `react@16.8.1`]);

        expect.assertions(0);
        command.context = mockContext;
        await command.execute();
    });

    test(`--package --grouped`, async () => {
        const command = cli.process([`license`, `--package`, `react@16.8.1`, `--grouped`]);

        expect.assertions(0);
        command.context = mockContext;
        await command.execute();
    });

    test(`--package --type`, async () => {
        const command = cli.process([
            `license`,
            `--package`,
            `react@16.8.1`,
            `--type`,
            `devDependencies`
        ]);

        expect.assertions(0);
        command.context = mockContext;
        await command.execute();
    });

    test(`--package --allow`, async () => {
        const command = cli.process([
            `license`,
            `--package`,
            `react@16.8.1`,
            `--allow`,
            `foo1`,
            `--allow`,
            `foo2`
        ]);

        expect.assertions(0);
        command.context = mockContext;
        await command.execute();
    });

    test(`--folder`, async () => {
        const command = cli.process([
            `license`,
            `--folder`,
            path.join("tests", "data", "testproject1")
        ]);

        expect.assertions(0);
        command.context = mockContext;

        await command.execute();
    });

    afterAll(() => server.close());
});
