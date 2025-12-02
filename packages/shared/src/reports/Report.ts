import { z } from "zod";

import { type IPackage } from "../package/package.js";
import { type IPackageJsonProvider } from "../providers/provider.js";
import { type IFormatter } from "../utils/formatter.js";
import { type PackageVersion } from "../visitors/visitor.js";
import { type DependencyTypes } from "./Validation.js";
import type { AttachmentData, Attachments } from "../attachments/Attachments.js";

export interface IReportConfig<
    TAttachments extends Attachments = Attachments
    // Params extends Record<string, any> = Record<string, any>
> {
    pkg: PackageVersion;
    type?: DependencyTypes;
    depth?: number;
    attachments?: TAttachments;
}

export type ReportConfigs = IReportConfig | IReportConfig[];

type PackageFromConfig<T> =
    T extends IReportConfig<infer Attachments> ? IPackage<AttachmentData<Attachments>> : never;

type PackagesFromConfigs<T> = T extends readonly IReportConfig<any>[]
    ? { [K in keyof T]: PackageFromConfig<T[K]> }
    : T extends IReportConfig<any>
      ? [PackageFromConfig<T>]
      : never;

export interface IReportContext {
    stdoutFormatter: IFormatter;
    stderrFormatter: IFormatter;
}

export interface IReport<
    TReportConfigs extends ReportConfigs,
    TParams extends {},
    TZodValidateObject extends z.ZodType<TParams>
> {
    readonly params: TParams;
    readonly name: string;
    readonly configs: TReportConfigs;
    readonly provider?: IPackageJsonProvider;

    exitCode: number;

    report(
        packages: PackagesFromConfigs<TReportConfigs>,
        context: IReportContext
    ): Promise<number | void>;

    validate?(): TZodValidateObject;
}

export type GenericReport = IReport<ReportConfigs, {}, z.ZodType<{}>>;

type ReportMethodSignature<T extends ReportConfigs> = IReport<T, {}, z.ZodType<{}>>["report"];
export type SingleReportMethodSignature = ReportMethodSignature<IReportConfig>;

export function isReportConfigArray(x: ReportConfigs): x is IReportConfig[] {
    return Array.isArray(x);
}

export abstract class AbstractReport<
    TParams extends {},
    TReportConfigs extends ReportConfigs = ReportConfigs,
    TZodValidateObject extends z.ZodType<TParams> = z.ZodType<TParams>
> implements IReport<TReportConfigs, TParams, TZodValidateObject> {
    abstract name: string;
    readonly params: TParams;
    abstract configs: TReportConfigs;

    provider: IPackageJsonProvider | undefined;

    exitCode: number = 0;

    constructor(params: TParams) {
        const result = this.validate?.().safeParse(params);

        if (result?.success) {
            this.params = result.data;
        } else {
            if (result?.error) throw new Error(result.error.toString());

            this.params = params;
        }
    }

    abstract report(
        packages: PackagesFromConfigs<TReportConfigs>,
        context: IReportContext
    ): Promise<number | void>;

    validate?(): TZodValidateObject;
}
