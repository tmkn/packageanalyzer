import { cli } from "../../src/cli/cli";
import { OnlinePackageProvider } from "../../src/providers/online";
import { createMockNpmServer, IMockServer } from "../server";
import { createMockContext } from "../common";
import { UpdateInfoCommand } from "../../src/cli/updateInfoCommand";

describe(`Update Info Command`, () => {
    let server: IMockServer;
    let provider: OnlinePackageProvider;

    beforeAll(async () => {
        server = await createMockNpmServer();
        provider = new OnlinePackageProvider(`http://localhost:${server.port}`);

        jest.setSystemTime(new Date(`2021-10-26`).getTime());
    });

    test(`--package`, async () => {
        const command = cli.process([`update`, `--package`, `react@16.8.1`]) as UpdateInfoCommand;

        expect.assertions(2);
        const { mockContext, stdout, stderr } = createMockContext();
        command.context = mockContext;
        command.beforeProcess = report => (report.provider = provider);

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    test(`Fails on missing version`, async () => {
        const command = cli.process([`update`, `--package`, `react`]) as UpdateInfoCommand;

        expect.assertions(2);
        const { mockContext, stdout, stderr } = createMockContext();
        command.context = mockContext;
        command.beforeProcess = report => (report.provider = provider);

        await command.execute();

        expect(stderr.lines.length).toBeGreaterThan(0);
        expect(stdout.lines.filter(l => l.trim() !== "").length).toBe(0);
    });

    test(`Fails on wrong provider`, async () => {
        const command = cli.process([`update`, `--package`, `react`]) as UpdateInfoCommand;

        expect.assertions(2);
        const { mockContext, stdout, stderr } = createMockContext();
        command.context = mockContext;
        command.beforeProcess = report => (report.provider = undefined);

        await command.execute();

        expect(stderr.lines.length).toBeGreaterThan(0);
        expect(stdout.lines.filter(l => l.trim() !== "").length).toBe(0);
    });

    afterAll(() => {
        jest.useRealTimers();

        return server.close();
    });
});
