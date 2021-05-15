import { IDecorator } from "../extensions/decorators/Decorator";
import { Package } from "../package/package";
import { IPackageVersionProvider } from "../providers/folder";
import { IFormatter } from "../utils/formatter";
import { DependencyTypes, PackageVersion } from "../visitors/visitor";

export interface IReport<T extends {}> {
    readonly name: string;
    readonly params: T;
    readonly pkg: PackageVersion;

    readonly decorators?: IDecorator<any>[];
    readonly provider?: IPackageVersionProvider;
    readonly type?: DependencyTypes;
    readonly depth?: number;

    report(pkg: Package, formatter: IFormatter): Promise<void>;
}