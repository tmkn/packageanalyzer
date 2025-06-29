import { cli } from "../../src/cli/cli.js";
import { OnlinePackageProvider } from "../../src/providers/online.js";
import { createMockNpmServer, type IMockServer } from "../server.js";
import { createMockContext } from "../common.js";
import { UpdateInfoCommand } from "../../src/cli/updateInfoCommand.js";
import { type IPackageJsonProvider } from "../../src/providers/provider.js";
import { type IPackageJson } from "../../src/npm.js";

describe(`Update Info Command`, () => {
    let server: IMockServer;
    let provider: OnlinePackageProvider;

    beforeAll(async () => {
        server = await createMockNpmServer();
        provider = new OnlinePackageProvider(`http://localhost:${server.port}`);

        vi.setSystemTime(new Date(`2021-10-26`).getTime());
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
        const command = cli.process([`update`, `--package`, `react@16.8.1`]) as UpdateInfoCommand;

        expect.assertions(2);
        const { mockContext, stdout, stderr } = createMockContext();
        command.context = mockContext;
        command.beforeProcess = report => {
            const wrongProvider = new (class implements IPackageJsonProvider {
                getPackageJson(name: string, version?: string | undefined): Promise<IPackageJson> {
                    return provider.getPackageJson(name, version);
                }
            })();

            report.provider = wrongProvider;
        };

        await command.execute();
        expect(stderr.lines.length).toBeGreaterThan(0);
        expect(stdout.lines.filter(l => l.trim() !== "").length).toBe(0);
    });

    afterAll(() => {
        vi.useRealTimers();

        return server.close();
    });
});
