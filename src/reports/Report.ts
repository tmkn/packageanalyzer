import { IDecorator } from "../extensions/decorators/Decorator";
import { Package } from "../package/package";
import { IPackageVersionProvider } from "../providers/folder";
import { IFormatter } from "../utils/formatter";
import { PackageVersion } from "../visitors/visitor";

export interface IReport<T extends {}> {
    readonly name: string;
    readonly params: T;
    readonly pkg: PackageVersion;

    decorators?: IDecorator<any>[];
    provider?: IPackageVersionProvider;

    report(pkg: Package, formatter: IFormatter): Promise<void>;
}
