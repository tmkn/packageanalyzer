import * as path from "path";
import z from "zod";

import { Command, Option } from "clipanion";

import { CliCommand } from "./common.js";
import type { AbstractReport } from "../reports/Report.js";

export class ReportCommand extends CliCommand<AbstractReport<any> | AbstractReport<any>[]> {
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

    async getReports(): Promise<AbstractReport<any> | AbstractReport<any>[]> {
        const importPath: string = path.isAbsolute(this.config)
            ? this.config
            : path.join(process.cwd(), this.config);
        const config = await import(importPath);

        const { reports } = ReportServiceConfigSchema.parse(config);

        return reports;
    }
}

export const ReportServiceConfigSchema = z.object({
    // todo provide a more specific schema for reports
    reports: z.array(z.any()).or(z.any())
});
