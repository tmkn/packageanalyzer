import { z } from "zod";

import { IPackage } from "../package/package";
import { IPackageJsonProvider } from "../providers/provider";
import { IFormatter } from "../utils/formatter";
import { PackageVersion } from "../visitors/visitor";
import { DependencyTypes } from "./Validation";
import { AttachmentData, IAttachment } from "../attachments/Attachments";

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
