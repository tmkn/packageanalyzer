import * as path from "path";

import { cli } from "../../src/cli/cli.js";
import { OnlinePackageProvider } from "../../src/providers/online.js";
import { createMockNpmServer, type IMockServer } from "../server.js";
import { createMockContext } from "../common.js";
import { TreeCommand } from "../../src/cli/treeCommand.js";

describe(`Tree Command`, () => {
    let server: IMockServer;
    let provider: OnlinePackageProvider;

    beforeAll(async () => {
        server = await createMockNpmServer();
        provider = new OnlinePackageProvider(`http://localhost:${server.port}`);
    });

    test(`--package --type`, async () => {
        const command = cli.process([
            `tree`,
            `--package`,
            `react@16.8.1`,
            `--type`,
            `dependencies`
        ]) as TreeCommand;
        command.beforeProcess = report => (report.provider = provider);

        expect.assertions(1);
        const { mockContext, stdout } = createMockContext();
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
    });

    test(`--folder --type`, async () => {
        const command = cli.process([
            `tree`,
            `--folder`,
            path.join("tests", "data", "testproject1"),
            `--type`,
            `dependencies`
        ]);

        expect.assertions(1);
        const { mockContext, stdout } = createMockContext();
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
    });

    afterAll(() => server.close());
});
