import * as path from "path";

import { cli } from "../../src/cli/cli";
import { DiffCommand } from "../../src/cli/diffCommand";
import { DumpPackageProvider } from "../../src/providers/folder";
import { createMockContext } from "../common";

describe(`Diff Command`, () => {
    const folder = path.join("tests", "data", "dump");
    let provider: DumpPackageProvider = new DumpPackageProvider(folder);

    test(`works correctly`, async () => {
        const command = cli.process([
            `diff`,
            `--range`,
            `react@16.12.0`,
            `react@18.2.0`
        ]) as DiffCommand;
        const { mockContext, stdout, stderr } = createMockContext();

        expect.assertions(2);
        command.context = mockContext;
        command.beforeProcess = report => (report.provider = provider);

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    test(`handles invalid params`, async () => {
        const command = cli.process([
            `diff`,
            `--range`,
            `react@16.12.0`,
            `react@18.2.0`
        ]) as DiffCommand;
        const { mockContext, stdout, stderr } = createMockContext();

        expect.assertions(2);
        command.context = mockContext;

        command.range = [];

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });
});
