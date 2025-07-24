import { type IPackage } from "../package/package.js";

// only expose certain properties of IPackage
type SimplePackage = Pick<IPackage, "name" | "version" | "fullName" | "getData">;

export interface IApplyArgs {
    p: SimplePackage;
    logger: (msg: string) => void;
}

export type AttachmentFn<T> = (args: IApplyArgs) => Promise<T>;

export type Attachments = { [key: string]: AttachmentFn<any> };

export type AttachmentData<T extends Attachments> = {
    [K in keyof T]: T[K] extends AttachmentFn<infer R> ? R : never;
};

export interface IClassAttachment<T> {
    apply: AttachmentFn<T>;
}

// Support for existing class based attachments.
// The newer system uses a single function instead of classes.
// This helper wraps a class based attachment so it can be used like a function.
// Directly using the .apply method doesn't work because "this" gets unbound.
// Using an arrow function would fix it, but that requires understanding the internals.
// Not the DX I want, instead this helper sets the correct "this" so existing class attachments can be used.
export function classToAttachmentFn<C extends new (...args: any[]) => IClassAttachment<any>>(
    ctor: C
): (...args: ConstructorParameters<C>) => InstanceType<C>["apply"] {
    return (...args: ConstructorParameters<C>) => {
        const instance = new ctor(...args);

        return instance.apply.bind(instance);
    };
}
