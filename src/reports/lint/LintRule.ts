import { z } from "zod";

import type { IPackage } from "../../package/package";
import { IDecorator } from "../../extensions/decorators/Decorator";

const LintTypes = z.union([z.literal("error"), z.literal("warning")]);

export type ILintTypes = z.infer<typeof LintTypes>;

export interface ILintCheck<T = undefined> {
    name: string;
    check: (pkg: IPackage, params: T) => string | string[] | void;
    decorators?: Record<string, IDecorator<string, unknown>>;
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

export function createDecorator(
    decorators: Record<string, IDecorator<string, unknown>>,
    i: number
): IDecorator<string, unknown> {
    return {
        key: i.toString(),
        name: `Decorator: Rule ${i}`,
        apply: async args => {
            const data: Record<string, unknown> = {};

            for (const key in decorators) {
                const decorator = decorators[key];
                const result = await decorator?.apply(args);

                data[key] = result;
            }

            return data;
        }
    };
}
