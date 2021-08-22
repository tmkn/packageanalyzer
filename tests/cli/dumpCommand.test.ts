import { cli } from "../../src/cli/cli";
import { NpmDumpCommand } from "../../src/cli/npmDumpCommand";

describe(`Npmdump Command`, () => {
    test(`--npmfile --package`, async () => {
        const command = cli.process([`npmdump`, `--package`, `foo`, `--npmfile`, `foo`]);

        expect(command).toBeInstanceOf(NpmDumpCommand);
    });
});
