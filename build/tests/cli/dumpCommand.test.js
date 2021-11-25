"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_1 = require("../../src/cli/cli");
const npmDumpCommand_1 = require("../../src/cli/npmDumpCommand");
describe(`Npmdump Command`, () => {
    test(`--npmfile --package`, async () => {
        const command = cli_1.cli.process([`npmdump`, `--package`, `foo`, `--npmfile`, `foo`]);
        expect(command).toBeInstanceOf(npmDumpCommand_1.NpmDumpCommand);
    });
});
//# sourceMappingURL=dumpCommand.test.js.map