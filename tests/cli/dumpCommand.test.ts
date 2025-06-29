import { cli } from "../../src/cli/cli.js";
import { NpmDumpCommand } from "../../src/cli/npmDumpCommand.js";

describe(`Npmdump Command`, () => {
    test(`--npmfile --package`, async () => {
        const command = cli.process([`npmdump`, `--package`, `foo`, `--npmfile`, `foo`]);

        expect(command).toBeInstanceOf(NpmDumpCommand);
    });
});
