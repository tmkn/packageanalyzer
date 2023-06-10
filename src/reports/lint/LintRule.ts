import { z } from "zod";

import type { IPackage } from "../../package/package";

const LintTypes = z.union([z.literal("error"), z.literal("warning")]);

export type ILintTypes = z.infer<typeof LintTypes>;

export interface ILintCheck<T = undefined> {
    name: string;
    check: (pkg: IPackage, params: T) => string | string[] | void;
}

export type LintRule<T> = T extends ILintCheck<infer Params>
    ? Params extends undefined
        ? [ILintTypes, ILintCheck<Params>]
        : [ILintTypes, T, Params]
    : never;

export const ZodLintRule = z.custom<LintRule<ILintCheck<any>>>(data => {
    if (Array.isArray(data)) {
        const [type, check] = data;

        const validType = LintTypes.safeParse(type).success;
        const validCheck =
            typeof check === "object" &&
            typeof check.name === "string" &&
            typeof check.check === "function";

        return validType && validCheck;
    }

    return false;
});

export function createRule<T>(...args: LintRule<ILintCheck<T>>): LintRule<ILintCheck<T>> {
    return [...args];
}
