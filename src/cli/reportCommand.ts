import { Command } from "clipanion";

import { IReports, ReportService } from "../reports/ReportService";
import { TreeReport } from "../reports/TreeReport";

export class ReportCommand extends Command {
    @Command.String(`--config`, {
        description: `todo help`
    })
    public config!: string;

    @Command.Path(`report`)
    async execute() {
        //const test: TestReport = require(`./abc`);
        const config: IReports = {
            reports: [new TreeReport({ package: `react` }), new TreeReport({ package: `fastify` })]
        };
        const reportService = new ReportService(config, this.context.stdout);

        await reportService.process();
    }
}
