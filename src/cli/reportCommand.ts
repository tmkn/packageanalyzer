import { Command } from "clipanion";

import { IReports } from "../reports/reports";
import { ReportService } from "../reports/ReportService";
import { TestReport } from "../reports/TestReport";

export class ReportCommand extends Command {
    @Command.String(`--config`, {
        description: `todo help`
    })
    public config!: string;

    @Command.Path(`report`)
    async execute() {
        //const test: TestReport = require(`./abc`);
        const config: IReports = {
            reports: [
                new TestReport({ package: `react` }),
                new TestReport({ package: `webpack` }),
                new TestReport({ package: `fastify` })
            ]
        };
        const reportService = new ReportService(config, this.context.stdout);

        await reportService.process();
    }
}
