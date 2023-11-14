import { z } from "zod";

import { Decorators } from "../extensions/decorators/Decorator";
import { IPackage } from "../package/package";
import { IPackageJsonProvider } from "../providers/provider";
import { IFormatter } from "../utils/formatter";
import { PackageVersion } from "../visitors/visitor";
import { DependencyTypes } from "./Validation";

export interface IReportContext {
    stdoutFormatter: IFormatter;
    stderrFormatter: IFormatter;
}

//type Args<T> = T extends Array<any> ? Array<Package> : [Package];
//better inferring for 1, 2 and 3 entries
export type Args<T, D extends Decorators> = T extends [PackageVersion]
    ? [IPackage<D>, ...undefined[]]
    : T extends [PackageVersion, PackageVersion]
      ? [IPackage<D>, IPackage<D>, ...undefined[]]
      : T extends [PackageVersion, PackageVersion, PackageVersion]
        ? [IPackage<D>, IPackage<D>, IPackage<D>, ...undefined[]]
        : T extends PackageVersion
          ? [IPackage<D>]
          : Array<IPackage<D> | undefined>;

export interface IReport<
    PackageEntry,
    Params extends {},
    ZodValidateObject extends z.ZodTypeAny,
    Deco extends Decorators = Decorators
> {
    readonly name: string;
    readonly params: Params;
    readonly pkg: PackageEntry;

    readonly decorators?: Deco;
    readonly provider?: IPackageJsonProvider;
    readonly type?: DependencyTypes;
    readonly depth?: number;

    exitCode: number;

    report(context: IReportContext, ...pkg: Args<PackageEntry, Deco>): Promise<number | void>;
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
    Deco extends Decorators = Decorators
> implements IReport<PackageEntry, Params, ZodValidateObject>
{
    abstract name: string;
    readonly params: Params;
    abstract pkg: PackageEntry;

    decorators: Deco | undefined;
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
        ...pkg: Args<PackageEntry, Deco>
    ): Promise<number | void>;

    validate?(): ZodValidateObject;
}
