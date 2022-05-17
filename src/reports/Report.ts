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

type Args<T> = T extends Array<any> ? Array<Package> : [Package];

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

export abstract class AbstractReport<P extends {}>
    implements IReport<PackageVersion | PackageVersion[], P>
{
    abstract name: string;
    readonly params: P;
    abstract pkg: PackageVersion | PackageVersion[];

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

    abstract report(context: IReportContext, ...pkgs: Package[]): Promise<void>;
    validate?(): t.Type<P, P, unknown>;
}
