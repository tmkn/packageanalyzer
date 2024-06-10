import { ZodType, z } from "zod";

import type { IPackage } from "../../package/package";
import { AttachmentData, IAttachment } from "../../attachments/Attachments";
import { MaintainerCheck } from "./checks/MaintainerCheck";
import { MissingDescription } from "./checks/MissingDescription";
import { MetaFileAttachment } from "../../attachments/MetaFileAttachment";
import { npmOnline } from "../../providers/online";
import { satisfies } from "semver";

const LintTypes = z.union([z.literal("error"), z.literal("warning")]);

export type ILintTypes = z.infer<typeof LintTypes>;

interface ISharedLintCheckParams<T> {
    name: string;
    checkParams?: () => ZodType<T>;
}

interface IBaseLintCheck<T = undefined> extends ISharedLintCheckParams<T> {
    check: (pkg: IPackage, params: T) => string | string[] | void;
}

interface ILintCheckWithAttachments<T = undefined, A extends IAttachment<string, any>[] = []>
    extends ISharedLintCheckParams<T> {
    check: (pkg: IPackage<AttachmentData<A>>, params: T) => string | string[] | void;
    attachments: A;
}

export type ILintCheck<
    T = undefined,
    A extends IAttachment<string, any>[] | undefined = undefined
> = A extends undefined ? IBaseLintCheck<T> : ILintCheckWithAttachments<T, Exclude<A, undefined>>;

let abc: ILintCheck<{ tom: string }, [MetaFileAttachment]> = {
    name: "test",
    attachments: [new MetaFileAttachment(npmOnline)],
    check: (pkg, params) => {
        params.tom;
        pkg.getAttachmentData("metafile");
        // pkg.getAttachmentData("sdf");
        return "";
    }
};

// type LintRule<LintCheck extends ILintCheck<any, any>> =
//     LintCheck extends ILintCheck<infer T, any>
//         ? T extends undefined
//             ? [ILintTypes, LintCheck]
//             : [ILintTypes, LintCheck, T]
//         : never;

// const test: LintRule<MaintainerCheck> = ["error", new MaintainerCheck(), { authors: ["test"] }];

// const test2: LintRule<typeof MissingDescription> = ["error", MissingDescription];

//already works
const test3: LintRuleTuple<{ tom: string }> = ["error", abc, { tom: "test" }];

const test4: LintRuleTuple = [
    "error",
    {
        name: "test",
        check: (pkg, params) => {
            return "";
        }
    }
    // todo remove this required param, should not be needed if undefined
    // undefined
];

export const ZodLintRule = z.custom<LintRuleTuple<any, any>>(data => {
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

// infer the correct LintCheck type
// it somehow does what it's supposed to do lol
type LintRuleTuple<
    P = undefined,
    A extends IAttachment<string, any>[] | undefined = undefined
> = A extends undefined
    ? // no attachments where provided
      P extends undefined
        ? // include params if provided, otherwise exclude
          [ILintTypes, IBaseLintCheck<P>]
        : [ILintTypes, IBaseLintCheck<P>, P]
    : // attachments where provided
      P extends undefined
      ? // include params if provided, otherwise exclude
        [ILintTypes, ILintCheckWithAttachments<P, Exclude<A, undefined>>]
      : [ILintTypes, ILintCheckWithAttachments<P, Exclude<A, undefined>>, P];

// helper function to create a rule with inference
export function createRule<P, A extends IAttachment<string, any>[] | undefined = undefined>(
    ...args: LintRuleTuple<P, A>
): LintRuleTuple<P, A> {
    return [...args];
}

export const LintFile = z.object({
    rules: z.array(ZodLintRule)
});

export type ILintFile = z.infer<typeof LintFile>;
