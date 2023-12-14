import { IPackage } from "../package/package";

export interface IAttachment<K extends string, T> {
    readonly key: K;
    readonly name: string;
    apply: (args: IApplyArgs) => Promise<T>;
}

// only expose certain properties of IPackage
type SimplePackage = Pick<IPackage, "name" | "version" | "fullName" | "getData">;

export interface IApplyArgs {
    p: SimplePackage;
    logger: (msg: string) => void;
}

export type Attachments = IAttachment<string, any> | Array<IAttachment<string, any>>;

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any
    ? R
    : never;

type ExtractAttachmentData<T> = T extends IAttachment<infer K, infer D> ? Record<K, D> : never;

// turns IAttachment(s) into a Record of their keys and data
export type AttachmentData<T extends IAttachment<string, any> | Array<IAttachment<string, any>>> =
    T extends IAttachment<string, any>
        ? ExtractAttachmentData<T>
        : T extends Array<infer A>
          ? UnionToIntersection<ExtractAttachmentData<A>>
          : never;
