import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

import dayjs from "dayjs";

import type { DependencyTypes } from "../../shared/src/reports/Validation.js";

export const defaultDependencyType: DependencyTypes = "dependencies";

export function getVersion(): string {
    try {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        // adjust when moving this function to another folder
        const file = path.join(__dirname, "..", "..", "..", "package.json");
        return JSON.parse(fs.readFileSync(file, "utf8")).version;
    } catch {
        return "version parse error!";
    }
}

export function daysAgo(date: string | number | Date): string {
    return `(${dayjs(new Date()).diff(date, "day")} days ago)`;
}
