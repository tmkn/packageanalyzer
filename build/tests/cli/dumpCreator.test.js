"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_1 = require("../../src/cli/cli");
const npmLookupCreatorCommand_1 = require("../../src/cli/npmLookupCreatorCommand");
describe(`Npmdump Lookup Creater`, () => {
    test(`--npmfile`, async () => {
        const command = cli_1.cli.process([`lookupfile`, `--npmfile`, `foo`]);
        expect(command).toBeInstanceOf(npmLookupCreatorCommand_1.NpmDumpLookupCreatorCommand);
    });
});
//# sourceMappingURL=dumpCreator.test.js.map