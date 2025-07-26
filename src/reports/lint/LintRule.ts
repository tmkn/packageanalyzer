import { type ZodTypeAny, z } from "zod";

import type { IPackage } from "../../package/package.js";
import type { AttachmentData, Attachments } from "../../attachments/Attachments.js";

const LintTypes = z.union([z.literal("error"), z.literal("warning")]);

export type ILintTypes = z.infer<typeof LintTypes>;

interface ISharedLintCheckParams {
    name: string;
    checkParams?: () => ZodTypeAny;
}

export interface IBaseLintCheck<T> extends ISharedLintCheckParams {
    check: (pkg: IPackage, params: T) => string | string[] | void;
}

export interface ILintCheckWithAttachments<T, A extends Attachments>
    extends ISharedLintCheckParams {
    check: (pkg: IPackage<AttachmentData<A>>, params: T) => string | string[] | void;
    attachments: A;
}

export type ILintCheck<T = undefined, A extends Attachments | undefined = undefined> = A extends {}
    ? ILintCheckWithAttachments<T, A>
    : IBaseLintCheck<T>;

type IBaseLintTuple<P> = P extends {}
    ? [ILintTypes, IBaseLintCheck<P>, P]
    : [ILintTypes, IBaseLintCheck<P>];

type ILintTupleWithAttachmentsTuple<P, A extends Attachments> = P extends {}
    ? [ILintTypes, ILintCheckWithAttachments<P, A>, P]
    : [ILintTypes, ILintCheckWithAttachments<P, A>];

// infer the correct LintCheck type
// it somehow does what it's supposed to do lol
export type LintRuleTuple<C extends ILintCheck<any, any> = ILintCheck> =
    C extends ILintCheck<infer P, infer A extends Attachments>
        ? ILintTupleWithAttachmentsTuple<P, A>
        : C extends ILintCheck<infer P>
          ? IBaseLintTuple<P>
          : never;

export function hasAttachments<P>(
    check: IBaseLintCheck<P> | ILintCheckWithAttachments<P, any>
): check is ILintCheckWithAttachments<P, any> {
    return "attachments" in check;
}

export const ZodLintRule = z.custom<LintRuleTuple<ILintCheck<any>>>(data => {
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

// todo unify createRule and createRuleWithAttachment for better developer experience
export function createRule<P = undefined>(...args: IBaseLintTuple<P>): IBaseLintTuple<P> {
    return [...args];
}

export function createRuleWithAttachment<P = undefined, A extends Attachments = {}>(
    ...args: ILintTupleWithAttachmentsTuple<P, A>
): ILintTupleWithAttachmentsTuple<P, A> {
    return [...args];
}

export const LintFile = z.object({
    rules: z.array(ZodLintRule)
});

export type ILintFile = z.infer<typeof LintFile>;
