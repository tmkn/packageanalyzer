import { Command } from "clipanion";

import { AbstractReport } from "../../../../packages/shared/src/reports/Report.js";
import { ReportService } from "../../../../packages/shared/src/reports/ReportService.js";
import { Formatter, type IFormatter } from "../../../../packages/shared/src/utils/formatter.js";
import { NodeHost } from "../../../../packages/node/src/host/NodeHost.js";

export abstract class CliCommand<
    T extends AbstractReport<any> | AbstractReport<any>[]
> extends Command {
    abstract getReports(): T | Promise<T>;

    exitCode = 0;

    beforeProcess: ((report: T) => void) | undefined = undefined;

    async execute(): Promise<number | void> {
        const host = new NodeHost(this.context.stdout, this.context.stderr);

        try {
            const reports = await this.getReports();
            const reportService = new ReportService(
                {
                    reports: Array.isArray(reports) ? reports : [reports]
                },
                host
            );

            this.beforeProcess?.(reports);
            this.exitCode = (await reportService.process()) ?? 0;
        } catch (e: unknown) {
            const stderrFormatter: IFormatter = new Formatter(host.getStderrWriter());

            if (e) stderrFormatter.writeLine(e?.toString());
            this.exitCode = 1;
        } finally {
            await Promise.all([host.getStdoutWriter().flush(), host.getStderrWriter().flush()]);
        }

        return this.exitCode;
    }
}
