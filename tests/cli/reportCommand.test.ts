import * as path from "path";

import { cli } from "../../src/cli/cli";
import { createMockContext } from "../common";
import { ReportCommand } from "../../src/cli/reportCommand";

describe(`Report Command`, () => {
    test(`works`, async () => {
        const command = cli.process([
            `report`,
            `--config`,
            path.join(process.cwd(), `tests`, `sampleReport.js`)
        ]);

        expect(command).toBeInstanceOf(ReportCommand);

        const { mockContext, stdout } = createMockContext();
        command.context = mockContext;
        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
    });
});
