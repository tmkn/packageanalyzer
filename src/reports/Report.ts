import { isLeft, isRight } from "fp-ts/lib/Either";
import * as t from "io-ts";
import reporter from "io-ts-reporters";

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

export interface IReport<T, P extends {}> {
    readonly name: string;
    readonly params: P;
    readonly pkg: T;

    readonly decorators?: IDecorator<any, any>[];
    readonly provider?: IPackageJsonProvider;
    readonly type?: DependencyTypes;
    readonly depth?: number;

    report(context: IReportContext, ...pkg: Args<T>): Promise<void>;
    validate?(): t.Type<P>;
}

export type ReportMethodSignature<T> = IReport<T, {}>["report"];
export type SingleReportMethodSignature = ReportMethodSignature<PackageVersion>;

export type EntryTypes = PackageVersion | PackageVersion[];

export function isPackageVersionArray(x: EntryTypes): x is PackageVersion[] {
    const [test] = x;

    return Array.isArray(test);
}

export abstract class AbstractReport<P extends {}, T extends EntryTypes = EntryTypes>
    implements IReport<T, P>
{
    abstract name: string;
    readonly params: P;
    abstract pkg: T;

    decorators: IDecorator<any, any>[] | undefined;
    provider: IPackageJsonProvider | undefined;
    type: DependencyTypes | undefined;
    depth: number | undefined;

    constructor(params: P) {
        const result = this.validate?.().decode(params);

        if (result) {
            if (isRight(result)) {
                this.params = result.right;
            } else {
                if (isLeft(result)) {
                    const errors: string[] = [];

                    for (const error of reporter.report(result)) {
                        errors.push(...[...new Set<string>(error.split(`\n`))]);
                    }

                    throw new Error(errors.join(`\n`));
                }

                throw new Error(`Validation error`);
            }
        } else {
            this.params = params;
        }
    }

    abstract report(context: IReportContext, ...pkg: Args<T>): Promise<void>;
    validate?(): t.Type<P, P, unknown>;
}
