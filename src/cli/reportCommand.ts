import * as path from "path";

import { Command } from "clipanion";

import { ReportService } from "../reports/ReportService";

export class ReportCommand extends Command {
    @Command.String(`--config`, {
        description: `todo help`
    })
    public config!: string;

    @Command.Path(`report`)
    async execute() {
        //const config = require(path.join(process.cwd(), `tests`, `sampleReport.js`));
        const config = require(this.config);
        const reportService = new ReportService(config, this.context.stdout);

        await reportService.process();
    }
}
