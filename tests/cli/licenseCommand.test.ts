import * as path from "path";
import { PassThrough } from "stream";

import { BaseContext } from "clipanion";

import { cli } from "../../src/cli/cli";
import { OnlinePackageProvider } from "../../src/providers/online";
import { createMockNpmServer, IMockServer } from "../server";
import { TestWritable } from "../common";
import { LicenseCheckCommand } from "../../src/cli/licenseCommand";

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
        const stdout = new TestWritable();
        const command = cli.process([`license`, `--package`, `react@16.8.1`]);
        LicenseCheckCommand.provider = provider;

        expect.assertions(1);
        mockContext.stdout = stdout;
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
    });

    test(`--package --grouped`, async () => {
        const stdout = new TestWritable();
        const command = cli.process([`license`, `--package`, `react@16.8.1`, `--grouped`]);
        LicenseCheckCommand.provider = provider;

        expect.assertions(1);
        mockContext.stdout = stdout;
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
    });

    test(`--package --type`, async () => {
        const stdout = new TestWritable();
        const command = cli.process([
            `license`,
            `--package`,
            `react@16.8.1`,
            `--type`,
            `devDependencies`
        ]);
        LicenseCheckCommand.provider = provider;

        expect.assertions(1);
        mockContext.stdout = stdout;
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
    });

    test(`--package --allow`, async () => {
        const stdout = new TestWritable();
        const command = cli.process([
            `license`,
            `--package`,
            `react@16.8.1`,
            `--allow`,
            `foo1`,
            `--allow`,
            `foo2`
        ]);
        LicenseCheckCommand.provider = provider;

        expect.assertions(1);
        mockContext.stdout = stdout;
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
    });

    test(`--folder`, async () => {
        const stdout = new TestWritable();
        const command = cli.process([
            `license`,
            `--folder`,
            path.join("tests", "data", "testproject1")
        ]);
        LicenseCheckCommand.provider = undefined;

        expect.assertions(1);
        mockContext.stdout = stdout;
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
    });

    afterAll(() => {
        LicenseCheckCommand.provider = undefined;

        return server.close();
    });
});
