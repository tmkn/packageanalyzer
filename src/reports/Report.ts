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
}

export abstract class AbstractReport<T extends {}> implements IReport<T> {
    abstract name: string;
    abstract params: T;
    abstract pkg: PackageVersion;

    decorators: IDecorator<any, any>[] | undefined;
    provider: IPackageJsonProvider | undefined;
    type: DependencyTypes | undefined;
    depth: number | undefined;

    abstract report(pkg: Package, context: IReportContext): Promise<void>;
}
