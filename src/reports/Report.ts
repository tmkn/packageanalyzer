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

export interface IReport<T extends {}> {
    readonly name: string;
    readonly params: T;
    readonly pkg: PackageVersion;

    readonly decorators?: IDecorator<any, any>[];
    readonly provider?: IPackageJsonProvider;
    readonly type?: DependencyTypes;
    readonly depth?: number;

    report(pkg: Package, context: IReportContext): Promise<void>;
    validate(): t.Type<T>;
}

export abstract class AbstractReport<T extends {}> implements IReport<T> {
    abstract name: string;
    readonly params: T;
    abstract pkg: PackageVersion;

    decorators: IDecorator<any, any>[] | undefined;
    provider: IPackageJsonProvider | undefined;
    type: DependencyTypes | undefined;
    depth: number | undefined;

    constructor(params: T) {
        const result = this.validate().decode(params);

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
    }

    abstract report(pkg: Package, context: IReportContext): Promise<void>;
    abstract validate(): t.Type<T, T, unknown>;
}
