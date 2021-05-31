import { Command } from "clipanion";

import { createLookupFile } from "../utils/lookup";

export class NpmDumpLookupCreatorCommand extends Command {
    @Command.String(`--npmfile`, { description: `path to a npmdump.json` })
    public npmFile?: string;

    static /*override*/ usage = Command.Usage({
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

    @Command.Path(`lookupfile`)
    async execute() {
        if (typeof this.npmFile !== "undefined") {
            await createLookupFile(this.npmFile);
        }
    }
}
