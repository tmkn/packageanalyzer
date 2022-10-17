import * as path from "path";

import { Command, Option } from "clipanion";

import { ReportService } from "../reports/ReportService";

export class ReportCommand extends Command {
    public config: string = Option.String(`--config`, {
        required: true,
        description: `path to the config file`
    });

    static override usage = Command.Usage({
        description: `run a series of checks defined in a config file`,
        details: `
            This command will run a series of checks defined in a config file
        `,
        examples: [[`Run a series of checks`, `$0 report --config ./path/to/config.js`]]
    });

    static override paths = [[`report`]];
    async execute() {
        const importPath: string = path.isAbsolute(this.config)
            ? this.config
            : path.join(process.cwd(), this.config);
        const config = require(importPath);
        const reportService = new ReportService(config, this.context.stdout, this.context.stderr);

        await reportService.process();
    }
}
