import * as path from "path";

import { Command } from "clipanion";

import { ReportService } from "../reports/ReportService";

export class ReportCommand extends Command {
    @Command.String(`--config`, {
        description: `path to the config file`
    })
    public config!: string;

    static override usage = Command.Usage({
        description: `run a series of checks defined in a config file`,
        details: `
            This command will run a series of checks defined in a config file
        `,
        examples: [[`Run a series of checks`, `$0 report --config ./path/to/config.js`]]
    });

    @Command.Path(`report`)
    async execute() {
        const importPath: string = path.isAbsolute(this.config)
            ? this.config
            : path.join(process.cwd(), this.config);
        const config = require(importPath);
        const reportService = new ReportService(config, this.context.stdout);

        await reportService.process();
    }
}
