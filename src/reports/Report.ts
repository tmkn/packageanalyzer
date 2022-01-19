import { isRight } from "fp-ts/lib/Either";
import * as t from "io-ts";

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
    readonly params: T | undefined;
    readonly pkg: PackageVersion;

    readonly decorators?: IDecorator<any, any>[];
    readonly provider?: IPackageJsonProvider;
    readonly type?: DependencyTypes;
    readonly depth?: number;

    report(pkg: Package, context: IReportContext): Promise<void>;
    validate?(): t.Type<T>;
}

export abstract class AbstractReport<T extends {}> implements IReport<T> {
    abstract name: string;
    readonly params: T | undefined = undefined;
    abstract pkg: PackageVersion;

    decorators: IDecorator<any, any>[] | undefined;
    provider: IPackageJsonProvider | undefined;
    type: DependencyTypes | undefined;
    depth: number | undefined;

    constructor(params: T) {
        const foo = this.validate?.();

        if (foo) {
            const data = foo.decode(params);

            if (isRight(data)) {
                this.params = data.right;
            }
        }
    }

    abstract report(pkg: Package, context: IReportContext): Promise<void>;
    abstract validate?(): t.Type<T, T, unknown>;
}
