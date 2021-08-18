import { cli } from "../../src/cli/cli";
import { NpmDumpLookupCreatorCommand } from "../../src/cli/npmLookupCreatorCommand";

describe(`Npmdump Lookup Creater`, () => {
    test(`--npmfile`, async () => {
        const command = cli.process([`lookupfile`, `--npmfile`, `foo`]);

        expect(command).toBeInstanceOf(NpmDumpLookupCreatorCommand);
    });
});
