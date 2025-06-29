import * as path from "path";

import { cli } from "../../src/cli/cli.js";
import { OnlinePackageProvider } from "../../src/providers/online.js";
import { createMockNpmServer, type IMockServer } from "../server.js";
import { createMockContext } from "../common.js";
import { LicenseCheckCommand } from "../../src/cli/licenseCommand.js";

describe(`License Check Command`, () => {
    let server: IMockServer;
    let provider: OnlinePackageProvider;

    beforeAll(async () => {
        server = await createMockNpmServer();
        provider = new OnlinePackageProvider(`http://localhost:${server.port}`);
    });

    test(`--package`, async () => {
        const command = cli.process([
            `license`,
            `--package`,
            `react@16.8.1`
        ]) as LicenseCheckCommand;
        command.beforeProcess = report => (report.provider = provider);

        expect.assertions(2);
        const { mockContext, stdout, stderr } = createMockContext();
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    test(`--package --grouped`, async () => {
        const command = cli.process([
            `license`,
            `--package`,
            `react@16.8.1`,
            `--grouped`
        ]) as LicenseCheckCommand;
        command.beforeProcess = report => (report.provider = provider);

        expect.assertions(2);
        const { mockContext, stdout, stderr } = createMockContext();
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    test(`--package --type`, async () => {
        const command = cli.process([
            `license`,
            `--package`,
            `react@16.8.1`,
            `--type`,
            `devDependencies`
        ]) as LicenseCheckCommand;
        command.beforeProcess = report => (report.provider = provider);

        expect.assertions(2);
        const { mockContext, stdout, stderr } = createMockContext();
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
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
        ]) as LicenseCheckCommand;
        command.beforeProcess = report => (report.provider = provider);

        expect.assertions(2);
        const { mockContext, stdout, stderr } = createMockContext();
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    test(`--folder`, async () => {
        const command = cli.process([
            `license`,
            `--folder`,
            path.join("tests", "data", "testproject1")
        ]) as LicenseCheckCommand;

        expect.assertions(2);
        const { mockContext, stdout, stderr } = createMockContext();
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    afterAll(() => {
        return server.close();
    });
});
