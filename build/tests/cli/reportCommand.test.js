"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const cli_1 = require("../../src/cli/cli");
const common_1 = require("../common");
const reportCommand_1 = require("../../src/cli/reportCommand");
describe(`Report Command`, () => {
    test(`works`, async () => {
        const command = cli_1.cli.process([
            `report`,
            `--config`,
            path.join(process.cwd(), `tests`, `sampleReport.js`)
        ]);
        expect(command).toBeInstanceOf(reportCommand_1.ReportCommand);
        const stdout = new common_1.TestWritable();
        const stderr = new common_1.TestWritable();
        command.context = {
            stdin: process.stdin,
            stdout: stdout,
            stderr: stderr
        };
        await command.execute();
        expect(stdout.lines).toMatchSnapshot();
    });
});
//# sourceMappingURL=reportCommand.test.js.map