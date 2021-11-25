"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NpmDumpLookupCreatorCommand = void 0;
const clipanion_1 = require("clipanion");
const lookup_1 = require("../utils/lookup");
class NpmDumpLookupCreatorCommand extends clipanion_1.Command {
    constructor() {
        super(...arguments);
        this.npmFile = clipanion_1.Option.String(`--npmfile`, { description: `path to a npmdump.json` });
    }
    async execute() {
        if (typeof this.npmFile !== "undefined") {
            await (0, lookup_1.createLookupFile)(this.npmFile);
        }
    }
}
exports.NpmDumpLookupCreatorCommand = NpmDumpLookupCreatorCommand;
NpmDumpLookupCreatorCommand.usage = clipanion_1.Command.Usage({
    category: `Developer Tools`,
    description: `creates a lookup file from a NPM dump`,
    details: `
            This command will create a lookup file from a NPM dump.
        `,
    examples: [
        [
            `Create a lookup file from a NPM dump`,
            `$0 lookupfile --npmfile /path/to/your/npmfile.json`
        ]
    ]
});
NpmDumpLookupCreatorCommand.paths = [[`lookupfile`]];
//# sourceMappingURL=npmLookupCreatorCommand.js.map