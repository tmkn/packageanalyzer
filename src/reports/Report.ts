import { z } from "zod";

import { IDecorator } from "../extensions/decorators/Decorator";
import { Package } from "../package/package";
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
export type Args<T> = T extends [PackageVersion]
    ? [Package, ...undefined[]]
    : T extends [PackageVersion, PackageVersion]
    ? [Package, Package, ...undefined[]]
    : T extends [PackageVersion, PackageVersion, PackageVersion]
    ? [Package, Package, Package, ...undefined[]]
    : T extends PackageVersion
    ? [Package]
    : Array<Package | undefined>;

export interface IReport<T, P extends {}, Z extends z.ZodTypeAny> {
    readonly name: string;
    readonly params: P;
    readonly pkg: T;

    readonly decorators?: IDecorator<any, any>[];
    readonly provider?: IPackageJsonProvider;
    readonly type?: DependencyTypes;
    readonly depth?: number;

    exitCode: number;

    report(context: IReportContext, ...pkg: Args<T>): Promise<number | void>;
    validate?(): Z;
}

export type ReportMethodSignature<T> = IReport<T, {}, z.ZodTypeAny>["report"];
export type SingleReportMethodSignature = ReportMethodSignature<PackageVersion>;

export type EntryTypes = PackageVersion | PackageVersion[];

export function isPackageVersionArray(x: EntryTypes): x is PackageVersion[] {
    const [test] = x;

    return Array.isArray(test);
}

export abstract class AbstractReport<
    P extends {},
    T extends EntryTypes = EntryTypes,
    Z extends z.ZodTypeAny = z.ZodTypeAny
> implements IReport<T, P, Z>
{
    abstract name: string;
    readonly params: P;
    abstract pkg: T;

    decorators: IDecorator<any, any>[] | undefined;
    provider: IPackageJsonProvider | undefined;
    type: DependencyTypes | undefined;
    depth: number | undefined;

    exitCode: number = 0;

    constructor(params: P) {
        const result = this.validate?.().safeParse(params);

        if (result?.success) {
            this.params = result.data;
        } else {
            if (result?.error) throw new Error(result.error.toString());

            this.params = params;
        }
    }

    abstract report(context: IReportContext, ...pkg: Args<T>): Promise<number | void>;

    validate?(): Z;
}
