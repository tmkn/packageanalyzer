import { cli } from "../../src/cli/cli.js";
import { NpmDumpLookupCreatorCommand } from "../../src/cli/npmLookupCreatorCommand.js";

describe(`Npmdump Lookup Creater`, () => {
    test(`--npmfile`, async () => {
        const command = cli.process([`lookupfile`, `--npmfile`, `foo`]);

        expect(command).toBeInstanceOf(NpmDumpLookupCreatorCommand);
    });
});
