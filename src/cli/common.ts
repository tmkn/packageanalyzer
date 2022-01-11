import * as path from "path";
import * as fs from "fs";

import * as dayjs from "dayjs";
import { Command } from "clipanion";

import { AbstractReport } from "../reports/Report";
import { ReportService } from "../reports/ReportService";
import { Formatter, IFormatter } from "../utils/formatter";
import { DependencyTypes } from "../reports/Validation";

export const defaultDependencyType: DependencyTypes = "dependencies";

export function isValidDependencyType(type: unknown): type is DependencyTypes {
    if (typeof type === "string" && (type === "dependencies" || type === "devDependencies"))
        return true;

    return false;
}

export function getVersion(): string {
    try {
        const file = path.join(__dirname, "./../../../package.json");

        return JSON.parse(fs.readFileSync(file, "utf8")).version;
    } catch (e) {
        return "version parse error!";
    }
}

export function daysAgo(date: string | number | Date): string {
    return `(${dayjs(new Date()).diff(date, "day")} days ago)`;
}

export abstract class CliCommand<T extends AbstractReport<any>> extends Command {
    abstract createReport(): T;

    beforeProcess: ((report: T) => void) | undefined = undefined;

    async execute(): Promise<number | void> {
        try {
            const report = this.createReport();
            const reportService = new ReportService(
                {
                    reports: [report]
                },
                this.context.stdout,
                this.context.stderr
            );

            this.beforeProcess?.(report);
            await reportService.process();
        } catch (e: any) {
            const stderrFormatter: IFormatter = new Formatter(this.context.stderr);

            stderrFormatter.writeLine(e);
        }
    }
}
