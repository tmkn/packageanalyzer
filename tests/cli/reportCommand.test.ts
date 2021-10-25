import * as path from "path";
import { PassThrough } from "stream";

import { cli } from "../../src/cli/cli";
import { TestWritable } from "../common";
import { ReportCommand } from "../../src/cli/reportCommand";

describe(`Report Command`, () => {
    test(`works`, async () => {
        const command = cli.process([
            `report`,
            `--config`,
            path.join(process.cwd(), `tests`, `sampleReport.js`)
        ]);

        expect(command).toBeInstanceOf(ReportCommand);

        const stdout = new TestWritable();
        command.context = {
            stdin: process.stdin,
            stdout: stdout,
            stderr: new PassThrough()
        };
        await command.execute();

        expect(stdout.lines.map(l => l.trimEnd())).toMatchSnapshot();
    });
});
