import dayjs from "dayjs";

import type { DependencyTypes } from "../../shared/src/reports/Validation.js";

export const defaultDependencyType: DependencyTypes = "dependencies";

export function getVersion(): string {
    return typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";
}

export function daysAgo(date: string | number | Date): string {
    return `(${dayjs(new Date()).diff(date, "day")} days ago)`;
}
