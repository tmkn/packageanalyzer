import * as path from "path";

import { cli } from "../../src/cli/cli.js";
import { createMockContext } from "../common.js";
import { ReportCommand } from "../../src/cli/reportCommand.js";

describe(`Report Command`, () => {
    test(`correctly runs multiple reports`, async () => {
        const command = cli.process([
            `report`,
            `--config`,
            path.join(process.cwd(), `tests`, `sampleReportMulti.js`)
        ]);

        expect(command).toBeInstanceOf(ReportCommand);

        const { mockContext, stdout, stderr } = createMockContext();
        command.context = mockContext;
        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    test(`correctly runs single report`, async () => {
        const command = cli.process([
            `report`,
            `--config`,
            path.join(process.cwd(), `tests`, `sampleReportSingle.js`)
        ]);

        expect(command).toBeInstanceOf(ReportCommand);

        const { mockContext, stdout, stderr } = createMockContext();
        command.context = mockContext;
        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });
});
