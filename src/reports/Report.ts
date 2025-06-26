import { z } from "zod";

import { type IPackage } from "../package/package.js";
import { type IPackageJsonProvider } from "../providers/provider.js";
import { type IFormatter } from "../utils/formatter.js";
import { type PackageVersion } from "../visitors/visitor.js";
import { type DependencyTypes } from "./Validation.js";
import type { AttachmentData, IAttachment } from "../attachments/Attachments.js";

export interface IReportContext {
    stdoutFormatter: IFormatter;
    stderrFormatter: IFormatter;
}

//better inferring for 1, 2 and 3 entries
export type Args<T, D extends Array<IAttachment<string, any>>> = T extends [PackageVersion]
    ? [IPackage<AttachmentData<D>>, ...undefined[]]
    : T extends [PackageVersion, PackageVersion]
      ? [IPackage<AttachmentData<D>>, IPackage<AttachmentData<D>>, ...undefined[]]
      : T extends [PackageVersion, PackageVersion, PackageVersion]
        ? [
              IPackage<AttachmentData<D>>,
              IPackage<AttachmentData<D>>,
              IPackage<AttachmentData<D>>,
              ...undefined[]
          ]
        : T extends PackageVersion
          ? [IPackage<AttachmentData<D>>]
          : Array<IPackage<AttachmentData<D>> | undefined>;

export interface IReport<
    PackageEntry,
    Params extends {},
    ZodValidateObject extends z.ZodTypeAny,
    Attachments extends Array<IAttachment<string, any>> = Array<IAttachment<string, any>>
> {
    readonly name: string;
    readonly params: Params;
    readonly pkg: PackageEntry;

    readonly attachments?: Attachments;
    readonly provider?: IPackageJsonProvider;
    readonly type?: DependencyTypes;
    readonly depth?: number;

    exitCode: number;

    report(
        context: IReportContext,
        ...pkg: Args<PackageEntry, Attachments>
    ): Promise<number | void>;
    validate?(): ZodValidateObject;
}

export type GenericReport = IReport<EntryTypes, any, z.ZodTypeAny>;

export type ReportMethodSignature<T> = IReport<T, {}, z.ZodTypeAny>["report"];
export type SingleReportMethodSignature = ReportMethodSignature<PackageVersion>;

export type EntryTypes = PackageVersion | PackageVersion[];

export function isPackageVersionArray(x: EntryTypes): x is PackageVersion[] {
    const [test] = x;

    return Array.isArray(test);
}

export abstract class AbstractReport<
    Params extends {},
    PackageEntry extends EntryTypes = EntryTypes,
    ZodValidateObject extends z.ZodTypeAny = z.ZodTypeAny,
    Attachments extends Array<IAttachment<string, any>> = Array<IAttachment<string, any>>
> implements IReport<PackageEntry, Params, ZodValidateObject, Attachments>
{
    abstract name: string;
    readonly params: Params;
    abstract pkg: PackageEntry;

    attachments: Attachments | undefined;
    provider: IPackageJsonProvider | undefined;
    type: DependencyTypes | undefined;
    depth: number | undefined;

    exitCode: number = 0;

    constructor(params: Params) {
        const result = this.validate?.().safeParse(params);

        if (result?.success) {
            this.params = result.data;
        } else {
            if (result?.error) throw new Error(result.error.toString());

            this.params = params;
        }
    }

    abstract report(
        context: IReportContext,
        ...pkg: Args<PackageEntry, Attachments>
    ): Promise<number | void>;

    validate?(): ZodValidateObject;
}
