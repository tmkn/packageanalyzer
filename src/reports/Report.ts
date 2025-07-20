import { z } from "zod";

import { type IPackage } from "../package/package.js";
import { type IPackageJsonProvider } from "../providers/provider.js";
import { type IFormatter } from "../utils/formatter.js";
import { type PackageVersion } from "../visitors/visitor.js";
import { type DependencyTypes } from "./Validation.js";
import type { AttachmentData, Attachments } from "../attachments/Attachments.js";
import type { createTarAttachment } from "../attachments/TarAttachment.js";

// todo add generics for attachments and params
interface IReportConfig<
    TAttachments extends Attachments = Attachments
    // Params extends Record<string, any> = Record<string, any>
> {
    pkg: PackageVersion;
    type: DependencyTypes;
    depth: number;
    attachments: TAttachments;
    // todo enable later for lint usage
    // params: Params;
}

type PackageFromConfig<T> =
    T extends IReportConfig<infer Attachments> ? IPackage<AttachmentData<Attachments>> : never;

type PackagesFromConfigs<T extends Array<IReportConfig<any>>> = {
    [K in keyof T]: PackageFromConfig<T[K]>;
};

let reportConfig: IReportConfig<{ tar: ReturnType<typeof createTarAttachment> }>;
let foo: PackageFromConfig<typeof reportConfig>;

const abc = foo!.getAttachmentData("tar");

export interface IReportContext {
    stdoutFormatter: IFormatter;
    stderrFormatter: IFormatter;
}

type MapPackageVersionsToPackages<T extends readonly unknown[], D extends Attachments> = {
    [K in keyof T]: T[K] extends PackageVersion ? IPackage<AttachmentData<D>> : never;
};

type Args<T, D extends Attachments> = T extends readonly PackageVersion[]
    ? MapPackageVersionsToPackages<T, D>
    : T extends PackageVersion
      ? [IPackage<AttachmentData<D>>]
      : never;

export interface IReport<
    PackageEntry,
    Params extends {},
    ZodValidateObject extends z.ZodTypeAny,
    TAttachments extends Attachments = Attachments
> {
    readonly name: string;
    readonly params: Params;
    readonly pkg: PackageEntry;

    readonly attachments?: TAttachments;
    readonly provider?: IPackageJsonProvider;
    readonly type?: DependencyTypes;
    readonly depth?: number;

    exitCode: number;

    report(pkg: Args<PackageEntry, TAttachments>, context: IReportContext): Promise<number | void>;
    validate?(): ZodValidateObject;
}

interface IReport2<ReportConfigs extends IReportConfig[], ZodValidateObject extends z.ZodTypeAny> {
    readonly name: string;
    readonly configs: ReportConfigs;
    readonly provider?: IPackageJsonProvider;

    exitCode: number;

    report(
        packages: PackagesFromConfigs<ReportConfigs>,
        context: IReportContext
    ): Promise<number | void>;

    validate?(): ZodValidateObject;
}

let foo2: IReport2<
    [typeof reportConfig, IReportConfig<{ asdfsadf: ReturnType<typeof createTarAttachment> }>],
    z.ZodTypeAny
>;

function test([[a, b], context]: Parameters<(typeof foo2)["report"]>) {
    const test1 = a.getAttachmentData("tar");
    const test2 = b.getAttachmentData("asdfsadf");
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
    TAttachments extends Attachments = Attachments
> implements IReport<PackageEntry, Params, ZodValidateObject, TAttachments>
{
    abstract name: string;
    readonly params: Params;
    abstract pkg: PackageEntry;

    attachments: TAttachments | undefined;
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
        pkg: Args<PackageEntry, TAttachments>,
        context: IReportContext
    ): Promise<number | void>;

    validate?(): ZodValidateObject;
}
